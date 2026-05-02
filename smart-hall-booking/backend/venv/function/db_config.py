import mysql.connector
from mysql.connector import Error

def get_connection():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='hall_booking_db',
            user='root',
            password='Kmabipriya@2007'   # உங்கள் MySQL password போடுங்க
        )
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Database connection error: {e}")
        return None