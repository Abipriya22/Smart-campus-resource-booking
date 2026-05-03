SMART-HALL-BOOKING/
├── backend/
│   └── venv/
│       ├── __pycache__/
│       ├── function/
│       │   ├── __pycache__/
│       │   ├── db_config.py        # Database connection & config
│       │   └── main.py             # App entry point / route handlers
│       ├── Include/
│       ├── Lib/
│       │   └── site-packages/
│       │       ├── _distutils_hack/
│       │       ├── pip/
│       │       ├── pip-24.0.dist-info/
│       │       ├── pkg_resources/
│       │       ├── setuptools/
│       │       └── setuptools-65.5.0.dist-info/
│       ├── Scripts/
│       │   ├── activate
│       │   ├── activate.bat
│       │   ├── Activate.ps1
│       │   ├── deactivate.bat
│       │   ├── pip.exe / pip3.exe / pip3.11.exe
│       │   ├── python.exe
│       │   └── pythonw.exe
│       └── pyvenv.cfg
│
├── frontend/
│   ├── node_modules/
│   ├── public/
│   └── src/
│       ├── pages/
│       ├── App.css
│       ├── App.js
│       ├── App.test.js
│       ├── index.css
│       ├── index.js
│       ├── logo.svg
│       ├── reportWebVitals.js
│       └── setupTests.js
│
├── .gitignore
├── package-lock.json
├── package.json
└── README.md



Setup instruction :
frontend 
-> npm start
backend(function folder)
-> python -m pip install fastapi uvicorn mysql-connector-python
-> python -m uvicorn main:app --reload
brycpt install (if needed)
-> pip install bcrypt==4.2.0