from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import datetime, timedelta
from app.db.database import get_db
from app.models.user import User, UserProfile, UserSession, UserRole
from app.routes.user import get_admin_user
from app.crud import user as crud_user

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

@router.get("/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Get admin dashboard analytics"""
    
    # User statistics
    total_users = db.query(func.count(User.id)).scalar()
    verified_users = db.query(func.count(User.id)).filter(User.is_verified == True).scalar()
    active_sessions = db.query(func.count(UserSession.id)).filter(
        UserSession.is_active == True,
        UserSession.expires_at > datetime.utcnow()
    ).scalar()
    
    # Users by role
    users_by_role = db.query(
        User.role,
        func.count(User.id).label('count')
    ).group_by(User.role).all()
    
    # Recent registrations (last 30 days)
    recent_registrations = db.query(func.count(User.id)).filter(
        User.created_at >= datetime.utcnow() - timedelta(days=30)
    ).scalar()
    
    # Profile completion rate
    profiles_with_names = db.query(func.count(UserProfile.id)).filter(
        UserProfile.first_name.isnot(None),
        UserProfile.last_name.isnot(None)
    ).scalar()
    
    # Security metrics
    password_resets_30d = 0  # Would track password reset events
    failed_logins_24h = 0    # Would track failed login attempts
    
    return {
        "user_statistics": {
            "total_users": total_users,
            "verified_users": verified_users,
            "unverified_users": total_users - verified_users,
            "verification_rate": round((verified_users / total_users * 100), 2) if total_users > 0 else 0,
            "profiles_with_names": profiles_with_names,
            "profile_completion_rate": round((profiles_with_names / total_users * 100), 2) if total_users > 0 else 0
        },
        "users_by_role": {role.value: count for role, count in users_by_role},
        "activity": {
            "recent_registrations_30d": recent_registrations,
            "active_sessions": active_sessions,
        },
        "security": {
            "password_resets_30d": password_resets_30d,
            "failed_logins_24h": failed_logins_24h
        }
    }

@router.get("/users/growth")
def get_user_growth(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Get user registration growth over time"""
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    growth_data = db.query(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('registrations')
    ).filter(
        User.created_at >= start_date
    ).group_by(func.date(User.created_at)).order_by(func.date(User.created_at)).all()
    
    # Calculate cumulative registrations
    cumulative = 0
    result = []
    for date, registrations in growth_data:
        cumulative += registrations
        result.append({
            "date": str(date),
            "registrations": registrations,
            "cumulative": cumulative
        })
    
    return {
        "period_days": days,
        "growth_data": result
    }

@router.post("/sessions/cleanup")
def cleanup_expired_sessions(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Manually trigger cleanup of expired sessions"""
    
    count = crud_user.clean_expired_sessions(db)
    return {"message": f"Cleaned up {count} expired sessions"}

@router.get("/sessions/active")
def get_active_sessions(
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Get list of active sessions across all users"""
    
    sessions = db.query(UserSession).join(User).filter(
        UserSession.is_active == True,
        UserSession.expires_at > datetime.utcnow()
    ).limit(limit).all()
    
    return [
        {
            "session_id": str(session.id),
            "user_id": session.user_id,
            "username": session.user.username,
            "ip_address": str(session.ip_address) if session.ip_address else None,
            "device_info": session.device_info,
            "created_at": session.created_at,
            "expires_at": session.expires_at
        }
        for session in sessions
    ]

@router.post("/users/{user_id}/force-logout")
def force_logout_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Force logout user from all sessions (admin only)"""
    
    user = crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    count = crud_user.invalidate_all_user_sessions(db, user_id)
    return {"message": f"User {user.username} logged out from {count} sessions"}