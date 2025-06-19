import logging
import sys

def setup_logging():
    
    detailed_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    console_handler = logging.StreamHandler(sys.stdout) #แสดง log บนหน้าจอ
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(detailed_formatter)
    
    error_handler = logging.FileHandler('logs/error.log') #บันทึก log ระดับ ERROR ลงไฟล์ logs/error.log
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(detailed_formatter)
    
    security_handler = logging.FileHandler('logs/security.log') #บันทึก log ด้าน security ลง logs/security.log
    security_handler.setLevel(logging.WARNING)
    security_handler.setFormatter(detailed_formatter)
    
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(error_handler)
    
    security_logger = logging.getLogger('security')
    security_logger.addHandler(security_handler)
    
    return root_logger, security_logger

def log_login_attempt(username: str, ip_address: str, success: bool): #บันทึก log การพยายาม login
    security_logger = logging.getLogger('security')
    status = "SUCCESS" if success else "FAILED"
    security_logger.warning(f"LOGIN_{status}: user={username} ip={ip_address}")

def log_password_change(user_id: int, ip_address: str): #บันทึก log การเปลี่ยนรหัสผ่าน
    security_logger = logging.getLogger('security')
    security_logger.warning(f"PASSWORD_CHANGE: user_id={user_id} ip={ip_address}")

