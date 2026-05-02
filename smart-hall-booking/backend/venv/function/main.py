from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date, timedelta, time as dt_time
from db_config import get_connection
from passlib.context import CryptContext

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True, # Change to False if using "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ─────────────────────────────────────────────
# MODELS
# ─────────────────────────────────────────────

class PasswordSet(BaseModel):
    password: str

class LoginRequest(BaseModel):
    id: str
    password: str

class BookingCreate(BaseModel):
    booking_id: str
    user_id: str
    resource_id: int
    booking_date: str
    end_date: Optional[str] = None
    start_time: str
    end_time: str
    status: Optional[str] = "Pending"
    purpose: Optional[str] = ""

class StatusUpdate(BaseModel):
    status: str
    Reject_Reason: Optional[str] = ""

# ─────────────────────────────────────────────
# HOME
# ─────────────────────────────────────────────

@app.get("/")
def home():
    return {"message": "Smart Hall Booking API running!"}

# ─────────────────────────────────────────────
# AUTH - CHECK ID
# ─────────────────────────────────────────────

@app.get("/check/student/{user_id}")
def check_student(user_id: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT User_id, Name, Password FROM User WHERE User_id = %s", (user_id.upper(),))
    user = cursor.fetchone()
    conn.close()
    if not user:
        raise HTTPException(status_code=404, detail="Roll number not found in system")
    return {"exists": True, "has_password": bool(user["Password"]), "name": user["Name"]}

@app.get("/check/admin/{admin_id}")
def check_admin(admin_id: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT Admin_id, Name, Password FROM Administrator WHERE Admin_id = %s", (admin_id.upper(),))
    admin = cursor.fetchone()
    conn.close()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin ID not found")
    return {"exists": True, "has_password": bool(admin["Password"]), "name": admin["Name"]}

# ─────────────────────────────────────────────
# AUTH - SET PASSWORD
# ─────────────────────────────────────────────

@app.post("/set-password/admin/{admin_id}")
def set_admin_password(admin_id: str, body: PasswordSet):
    conn = get_connection()
    cursor = conn.cursor()
    hashed = pwd_context.hash(body.password)
    cursor.execute("UPDATE Administrator SET Password = %s WHERE Admin_id = %s", (hashed, admin_id.upper()))
    conn.commit()
    conn.close()
    return {"message": "Password set successfully"}

@app.post("/set-password/student/{user_id}")
def set_student_password(user_id: str, body: PasswordSet):
    conn = get_connection()
    cursor = conn.cursor()
    hashed = pwd_context.hash(body.password)
    cursor.execute("UPDATE User SET Password = %s WHERE User_id = %s", (hashed, user_id.upper()))
    conn.commit()
    conn.close()
    return {"message": "Password set successfully"}
# ─────────────────────────────────────────────
# AUTH - LOGIN
# ─────────────────────────────────────────────

@app.post("/login/student")
def student_login(body: LoginRequest):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM User WHERE User_id = %s", (body.id.upper(),))
    user = cursor.fetchone()
    conn.close()
    if not user:
        raise HTTPException(status_code=404, detail="Roll number not found")
    if not user["Password"]:
        raise HTTPException(status_code=403, detail="NO_PASSWORD")
    if not pwd_context.verify(body.password, user["Password"]):
        raise HTTPException(status_code=401, detail="Wrong password")
    return user

@app.post("/login/admin")
def admin_login(body: LoginRequest):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Administrator WHERE Admin_id = %s", (body.id.upper(),))
    admin = cursor.fetchone()
    conn.close()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin ID not found")
    if not admin["Password"]:
        raise HTTPException(status_code=403, detail="NO_PASSWORD")
    if not pwd_context.verify(body.password, admin["Password"]):
        raise HTTPException(status_code=401, detail="Wrong password")
    return admin

# ─────────────────────────────────────────────
# RESOURCES - AVAILABLE HALLS
# ─────────────────────────────────────────────

@app.get("/resources/available")
def get_available_halls(start_date: str, end_date: str, start: str, end: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT r.Resource_id, r.Hall_no, r.Type, r.Capacity,
               r.Block, r.Floor_no, r.Admin_id,
               a.Amenity_name, a.Type as Amenity_type
        FROM Resource r
        LEFT JOIN Amenity a ON r.Resource_id = a.Resource_id
        ORDER BY r.Block, r.Hall_no
    """)
    all_halls = cursor.fetchall()

    start_fmt = start + ':00' if len(start) == 5 else start
    end_fmt   = end   + ':00' if len(end)   == 5 else end

    # Already booked halls from DB
    cursor.execute("""
        SELECT DISTINCT Resource_id FROM Books
        WHERE Status != 'Rejected'
        AND Booking_Date BETWEEN %s AND %s
        AND Start_Time < %s AND End_Time > %s
    """, (start_date, end_date, end_fmt, start_fmt))
    booked_ids = {row['Resource_id'] for row in cursor.fetchall()}
    conn.close()

    # Working hours check (Mon-Fri 08:30-16:30)
    def is_working_overlap(sd_str, ed_str, st_str, et_str):
        sd = datetime.strptime(sd_str, '%Y-%m-%d').date()
        ed = datetime.strptime(ed_str, '%Y-%m-%d').date()
        work_start = dt_time(8, 30)
        work_end   = dt_time(16, 30)
        req_start  = datetime.strptime(st_str, '%H:%M:%S').time()
        req_end    = datetime.strptime(et_str, '%H:%M:%S').time()
        current = sd
        while current <= ed:
            if current.weekday() <= 4:  # Mon-Fri
                if req_start < work_end and req_end > work_start:
                    return True
            current += timedelta(days=1)
        return False

    working_conflict = is_working_overlap(start_date, end_date, start_fmt, end_fmt)

    seen = set()
    result = []
    for h in all_halls:
        rid = h['Resource_id']
        if rid in seen:
            continue
        seen.add(rid)
        if h['Type'] == 'classroom' and working_conflict:
            h['available'] = False
            h['booked_reason'] = 'Academic Class (8:30 AM – 4:30 PM)'
        else:
            h['available'] = rid not in booked_ids
            h['booked_reason'] = 'Already booked for this slot' if rid in booked_ids else ''
        result.append(h)

    return result

# ─────────────────────────────────────────────
# BOOKINGS - CREATE
# ─────────────────────────────────────────────

@app.post("/bookings")
def create_booking(booking: BookingCreate):
    conn = get_connection()
    cursor = conn.cursor()

    start_fmt = booking.start_time if len(booking.start_time) == 8 else booking.start_time + ':00'
    end_fmt   = booking.end_time   if len(booking.end_time)   == 8 else booking.end_time   + ':00'
    end_date  = booking.end_date if booking.end_date else booking.booking_date

    cursor.execute("""
        SELECT Booking_id FROM Books
        WHERE Resource_id = %s AND Status != 'Rejected'
        AND Booking_Date BETWEEN %s AND %s
        AND Start_Time < %s AND End_Time > %s
    """, (booking.resource_id, booking.booking_date, end_date, end_fmt, start_fmt))

    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="This hall is already booked for this time slot!")

    cursor.execute("""
        INSERT INTO Books (Booking_id, User_id, Resource_id, Booking_Date, Start_Time, End_Time, Status, Purpose)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        booking.booking_id, booking.user_id, booking.resource_id,
        booking.booking_date, start_fmt, end_fmt, booking.status, booking.purpose
    ))
    conn.commit()
    conn.close()
    return {"message": "Booking submitted!", "booking_id": booking.booking_id}

# ─────────────────────────────────────────────
# BOOKINGS - GET ALL (Admin)
# ─────────────────────────────────────────────

@app.get("/bookings")
def get_all_bookings():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT b.Booking_id, b.User_id, b.Booking_Date,
               b.Start_Time, b.End_Time, b.Status, b.Purpose, b.Reject_Reason,
               u.Name as User_Name, u.Department,
               r.Hall_no, r.Block, r.Type as Hall_Type
        FROM Books b
        JOIN User u ON b.User_id = u.User_id
        JOIN Resource r ON b.Resource_id = r.Resource_id
        ORDER BY b.Booking_Date DESC
    """)
    bookings = cursor.fetchall()
    conn.close()
    for b in bookings:
        b['Start_Time']   = str(b['Start_Time'])   if b.get('Start_Time')   else ''
        b['End_Time']     = str(b['End_Time'])     if b.get('End_Time')     else ''
        b['Booking_Date'] = str(b['Booking_Date']) if b.get('Booking_Date') else ''
    return bookings

# ─────────────────────────────────────────────
# BOOKINGS - GET BY USER (Student)
# ─────────────────────────────────────────────

@app.get("/bookings/user/{user_id}")
def get_user_bookings(user_id: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT b.Booking_id, b.User_id, b.Booking_Date,
               b.Start_Time, b.End_Time, b.Status, b.Purpose, b.Reject_Reason,
               r.Hall_no, r.Block, r.Type as Hall_Type
        FROM Books b
        JOIN Resource r ON b.Resource_id = r.Resource_id
        WHERE b.User_id = %s
        ORDER BY b.Booking_Date DESC
    """, (user_id,))
    bookings = cursor.fetchall()
    conn.close()
    for b in bookings:
        b['Start_Time']   = str(b['Start_Time'])   if b.get('Start_Time')   else ''
        b['End_Time']     = str(b['End_Time'])     if b.get('End_Time')     else ''
        b['Booking_Date'] = str(b['Booking_Date']) if b.get('Booking_Date') else ''
        b['Reject_Reason'] = b.get('Reject_Reason') or ''
    return bookings

# ─────────────────────────────────────────────
# BOOKINGS - UPDATE STATUS
# ─────────────────────────────────────────────

@app.put("/bookings/{booking_id}/status")
def update_status(booking_id: str, update: StatusUpdate):
    if update.status not in ["Approved", "Rejected", "Pending"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE Books SET Status = %s, Reject_Reason = %s WHERE Booking_id = %s",
        (update.status, update.Reject_Reason or '', booking_id)
    )
    conn.commit()
    conn.close()
    return {"message": f"Booking {booking_id} → {update.status}"}

# ─────────────────────────────────────────────
# BOOKINGS - DELETE
# ─────────────────────────────────────────────

@app.delete("/bookings/{booking_id}")
def delete_booking(booking_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Books WHERE Booking_id = %s", (booking_id,))
    conn.commit()
    conn.close()
    return {"message": f"Booking {booking_id} cancelled"}

# ─────────────────────────────────────────────
# PROFILE - GET STUDENT
# ─────────────────────────────────────────────

@app.get("/profile/student/{user_id}")
def get_student_profile(user_id: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT u.User_id, u.Name, u.Email, u.Department, u.User_type,
               COUNT(b.Booking_id) as total_bookings,
               SUM(CASE WHEN b.Status='Approved' THEN 1 ELSE 0 END) as approved,
               SUM(CASE WHEN b.Status='Pending'  THEN 1 ELSE 0 END) as pending,
               SUM(CASE WHEN b.Status='Rejected' THEN 1 ELSE 0 END) as rejected
        FROM User u
        LEFT JOIN Books b ON u.User_id = b.User_id
        WHERE u.User_id = %s
        GROUP BY u.User_id
    """, (user_id,))
    profile = cursor.fetchone()
    conn.close()
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return profile

# ─────────────────────────────────────────────
# PROFILE - GET ADMIN
# ─────────────────────────────────────────────

@app.get("/profile/admin/{admin_id}")
def get_admin_profile(admin_id: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.Admin_id, a.Name, a.Block,
               COUNT(b.Booking_id) as total_bookings,
               SUM(CASE WHEN b.Status='Approved' THEN 1 ELSE 0 END) as approved,
               SUM(CASE WHEN b.Status='Pending'  THEN 1 ELSE 0 END) as pending,
               SUM(CASE WHEN b.Status='Rejected' THEN 1 ELSE 0 END) as rejected
        FROM Administrator a
        LEFT JOIN Resource r ON a.Admin_id = r.Admin_id
        LEFT JOIN Books b ON r.Resource_id = b.Resource_id
        WHERE a.Admin_id = %s
        GROUP BY a.Admin_id
    """, (admin_id,))
    profile = cursor.fetchone()
    conn.close()
    if not profile:
        raise HTTPException(status_code=404, detail="Admin not found")
    return profile
