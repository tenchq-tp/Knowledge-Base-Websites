from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from app.db.database import get_db
from app.models.user import User, UserProfile, UserSession, UserRole
from app.routes.auth import get_admin_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Get admin dashboard analytics"""
    
    # User statistics
    total_users = db.query(func.count(User.id)).scalar()
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    verified_users = db.query(func.count(User.id)).filter(User.is_verified == True).scalar()
    
    # Users by role
    users_by_role = db.query(
        User.role,
        func.count(User.id).label('count')
    ).group_by(User.role).all()
    
    # Recent registrations (last 30 days)
    recent_registrations = db.query(func.count(User.id)).filter(
        User.created_at >= func.now() - text("INTERVAL '30 days'")
    ).scalar()
    
    # Active sessions
    active_sessions = db.query(func.count(UserSession.id)).filter(
        UserSession.is_active == True,
        UserSession.expires_at > func.now()
    ).scalar()
    
    # Users with profiles completed (has first_name and last_name)
    completed_profiles = db.query(func.count(UserProfile.id)).filter(
        UserProfile.first_name.isnot(None),
        UserProfile.last_name.isnot(None)
    ).scalar()
    
    # Recent activity (last 7 days)
    recent_activity = db.query(
        func.date(User.last_login).label('date'),
        func.count(User.id).label('logins')
    ).filter(
        User.last_login >= func.now() - text("INTERVAL '7 days'")
    ).group_by(func.date(User.last_login)).all()
    
    return {
        "user_statistics": {
            "total_users": total_users,
            "active_users": active_users,
            "verified_users": verified_users,
            "inactive_users": total_users - active_users,
            "completed_profiles": completed_profiles,
            "profile_completion_rate": round((completed_profiles / total_users * 100), 2) if total_users > 0 else 0
        },
        "users_by_role": {role.value: count for role, count in users_by_role},
        "activity": {
            "recent_registrations_30d": recent_registrations,
            "active_sessions": active_sessions,
            "recent_logins_7d": [{"date": str(date), "logins": logins} for date, logins in recent_activity]
        }
    }

@router.get("/users/growth")
def get_user_growth(
    days: int = 30,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Get user registration growth over time"""
    
    growth_data = db.query(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('registrations'),
        func.sum(func.count(User.id)).over(
            order_by=func.date(User.created_at)
        ).label('cumulative')
    ).filter(
        User.created_at >= func.now() - text(f"INTERVAL '{days} days'")
    ).group_by(func.date(User.created_at)).order_by(func.date(User.created_at)).all()
    
    return {
        "period_days": days,
        "growth_data": [
            {
                "date": str(date),
                "registrations": registrations,
                "cumulative": cumulative
            }
            for date, registrations, cumulative in growth_data
        ]
    }