"""
SQLAlchemy Models for Pasumpon Chit ERP System

This module defines all database models mapped to tables in the MySQL database.
All models inherit from Base, which is configured in database.py.

Usage:
    from models import Member, PanduGroup, etc.
    member = Member.query.get(1)
"""

from datetime import date
from typing import Optional, List
from decimal import Decimal

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Numeric,
    Text,
    Boolean,
    Date,
    ForeignKey,
)

from sqlalchemy.dialects.mysql import (
    INTEGER,
    VARCHAR as MySQLVARCHAR,
    DATETIME,
    DECIMAL,
)

from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# ==========================================
# MEMBERS TABLE
# ==========================================


class Member(Base):
    """Members table - Core member/master data for all community programs"""

    __tablename__ = "members"

    id = Column(Integer, primary_key=True)
    member_code = Column(MySQLVARCHAR(20), unique=True, nullable=False)
    member_name = Column(MySQLVARCHAR(255), nullable=False)
    mobile = Column(MySQLVARCHAR(20))
    village = Column(MySQLVARCHAR(100))
    address = Column(Text)
    photo = Column(Text)  # Store path or base64
    join_date = Column(Date, default=date.today)

    # Relationships
    pandu_assignments = None  # Lazy loading to avoid circular imports

    def __repr__(self):
        return f"<Member(id={self.id}, member_code={self.member_code}, member_name={self.member_name})>"

    def to_dict(self):
        return {
            "id": self.id,
            "member_code": self.member_code,
            "member_name": self.member_name,
            "mobile": self.mobile,
            "village": self.village,
            "address": self.address,
            "photo": self.photo,
            "join_date": self.join_date.isoformat() if self.join_date else None,
        }

    @classmethod
    def get_by_member_code(cls, session, member_code):
        """Get member by member code"""
        return session.query(cls).filter(cls.member_code == member_code).first()

    @classmethod
    def get_pending(cls, session):
        """Get members with pending collections for current month"""
        from sqlalchemy import extract
        from datetime import datetime
        current_year = datetime.now().year
        current_month = datetime.now().month

        return session.query(cls).filter(
            ~exists()
            .where(cls.id == PanduAssignment.member_id)
            .where(cls.id == PanduAssignment.member_id)
        )


# ==========================================
# PANDU GROUPS TABLE
# ==========================================


class PanduGroup(Base):
    """Pandu Groups - Chit/Savings programs with parameters"""

    __tablename__ = "pandu_groups"

    id = Column(Integer, primary_key=True)
    group_code = Column(MySQLVARCHAR(10))  # Usually current year
    group_name = Column(MySQLVARCHAR(255), nullable=False)
    monthly_due = Column(Numeric(10, 2), nullable=False)
    chit_amount = Column(Numeric(12, 2), nullable=False)
    duration_months = Column(Integer, nullable=False)
    status = Column(MySQLVARCHAR(20), default="ACTIVE")  # ACTIVE, CLOSED
    pandu_year = Column(Integer)  # Current year for active groups

    # Relationships
    assignments = None

    def __repr__(self):
        return f"<PanduGroup(id={self.id}, group_name={self.group_name})>"

    def to_dict(self):
        return {
            "id": self.id,
            "group_code": self.group_code,
            "group_name": self.group_name,
            "monthly_due": float(self.monthly_due),
            "chit_amount": float(self.chit_amount),
            "duration_months": self.duration_months,
            "status": self.status,
            "pandu_year": self.pandu_year,
        }


# ==========================================
# PANDU ASSIGNMENTS TABLE
# ==========================================


class PanduAssignment(Base):
    """Pandu Assignments - Member-group relationships with payment tracking"""

    __tablename__ = "pandu_assignments"

    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("pandu_groups.id"), nullable=False)
    pandu_count = Column(Integer, nullable=False)
    group_monthly_due = Column(Numeric(10, 2), nullable=False)
    group_chit_amount = Column(Numeric(12, 2), nullable=False)
    duration_months = Column(Integer, nullable=False)
    total_amount = Column(Numeric(15, 2), nullable=False)
    paid_amount = Column(Numeric(15, 2), default=0)
    balance_amount = Column(Numeric(15, 2), nullable=False)
    settlement_amount = Column(Numeric(15, 2))
    join_date = Column(Date, default=date.today)
    is_settled = Column(Boolean, default=False)
    settlement_date = Column(Date)
    settlement_remarks = Column(Text)
    qr_code = Column(MySQLVARCHAR(50))
    status = Column(MySQLVARCHAR(20), default="ACTIVE")  # ACTIVE, SETTLED

    # Relationships
    member = None
    group = None
    collections = None

    def __repr__(self):
        return f"<PanduAssignment(id={self.id}, member_id={self.member_id})>"

    def to_dict(self):
        return {
            "id": self.id,
            "member_id": self.member_id,
            "group_id": self.group_id,
            "pandu_count": self.pandu_count,
            "group_monthly_due": float(self.group_monthly_due),
            "group_chit_amount": float(self.group_chit_amount),
            "duration_months": self.duration_months,
            "total_amount": float(self.total_amount),
            "paid_amount": float(self.paid_amount),
            "balance_amount": float(self.balance_amount),
            "settlement_amount": float(self.settlement_amount) if self.settlement_amount else 0,
            "join_date": self.join_date.isoformat() if self.join_date else None,
            "is_settled": self.is_settled,
            "settlement_date": self.settlement_date.isoformat() if self.settlement_date else None,
            "settlement_remarks": self.settlement_remarks,
            "qr_code": self.qr_code,
            "status": self.status,
        }


# ==========================================
# COLLECTIONS TABLE
# ==========================================


class Collection(Base):
    """Collections - Monthly collection transactions (Pandu)"""

    __tablename__ = "collections"

    id = Column(Integer, primary_key=True)
    assignment_id = Column(Integer, ForeignKey("pandu_assignments.id"), nullable=False)
    receipt_no = Column(MySQLVARCHAR(20))
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    collection_date = Column(DateTime, default=date.today)
    amount = Column(Numeric(12, 2), nullable=False)
    collection_month = Column(Integer)  # Month of collection
    collection_year = Column(Integer)  # Year of collection
    payment_mode = Column(MySQLVARCHAR(50))

    # Relationships
    assignment = None
    member = None

    def __repr__(self):
        return f"<Collection(id={self.id}, amount={self.amount})>"

    def to_dict(self):
        return {
            "id": self.id,
            "assignment_id": self.assignment_id,
            "receipt_no": self.receipt_no,
            "member_id": self.member_id,
            "collection_date": self.collection_date,
            "amount": float(self.amount),
            "collection_month": self.collection_month,
            "collection_year": self.collection_year,
            "payment_mode": self.payment_mode,
        }


# ==========================================
# KANTHU MASTER TABLE
# ==========================================


class KanthuMaster(Base):
    """Kanthu Master - Loan accounts with interest tracking"""

    __tablename__ = "kanthu_master"

    id = Column(Integer, primary_key=True)
    kanthu_no = Column(Integer, unique=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    issue_date = Column(Date)
    principal_amount = Column(Numeric(12, 2), nullable=False)
    interest_percent = Column(Numeric(5, 2), nullable=False)
    interest_amount = Column(Numeric(12, 2))
    total_collected = Column(Numeric(12, 2), default=0)
    net_paid_amount = Column(Numeric(12, 2))
    balance_amount = Column(Numeric(12, 2), nullable=False)
    status = Column(MySQLVARCHAR(20), default="ACTIVE")  # ACTIVE, CLOSED
    due_year = Column(Integer)
    financial_year = Column(Integer)
    remarks = Column(Text)

    # Relationships
    member = None
    transactions = None

    def __repr__(self):
        return f"<KanthuMaster(id={self.id}, kanthu_no={self.kanthu_no})>"

    def to_dict(self):
        return {
            "id": self.id,
            "kanthu_no": self.kanthu_no,
            "member_id": self.member_id,
            "issue_date": self.issue_date.isoformat() if self.issue_date else None,
            "principal_amount": float(self.principal_amount),
            "interest_percent": float(self.interest_percent),
            "interest_amount": float(self.interest_amount) if self.interest_amount else 0,
            "total_collected": float(self.total_collected),
            "net_paid_amount": float(self.net_paid_amount) if self.net_paid_amount else 0,
            "balance_amount": float(self.balance_amount),
            "status": self.status,
            "due_year": self.due_year,
            "financial_year": self.financial_year,
            "remarks": self.remarks,
        }


# ==========================================
# KANTHU TRANSACTIONS TABLE
# ==========================================


class KanthuTransaction(Base):
    """Kanthu Transactions - Individual loan payment/issue records"""

    __tablename__ = "kanthu_transactions"

    id = Column(Integer, primary_key=True)
    kanthu_id = Column(Integer, ForeignKey("kanthu_master.id"), nullable=False)
    transaction_date = Column(DateTime, default=date.today)
    transaction_type = Column(MySQLVARCHAR(20))  # ISSUE, COLLECTION
    amount = Column(Numeric(12, 2), nullable=False)
    remarks = Column(Text)

    # Relationships
    kanthu = None

    def __repr__(self):
        return f"<KanthuTransaction(id={self.id}, amount={self.amount})>"

    def to_dict(self):
        return {
            "id": self.id,
            "kanthu_id": self.kanthu_id,
            "transaction_date": self.transaction_date,
            "transaction_type": self.transaction_type,
            "amount": float(self.amount),
            "remarks": self.remarks,
        }


# ==========================================
# ACCOUNTS TRANSACTIONS TABLE
# ==========================================


class AccountsTransaction(Base):
    """Accounts Transactions - General ledger entries for all modules"""

    __tablename__ = "accounts_transactions"

    id = Column(Integer, primary_key=True)
    transaction_date = Column(DateTime, default=date.today)
    transaction_type = Column(MySQLVARCHAR(10))  # CREDIT, DEBIT
    category = Column(MySQLVARCHAR(100))
    amount = Column(Numeric(12, 2), nullable=False)
    payment_mode = Column(MySQLVARCHAR(50))
    reference_module = Column(MySQLVARCHAR(50))  # KANTHU, PANDU, MEMBER
    reference_id = Column(Integer)
    remarks = Column(Text)

    def __repr__(self):
        return f"<AccountsTransaction(id={self.id}, amount={self.amount})>"

    def to_dict(self):
        return {
            "id": self.id,
            "transaction_date": self.transaction_date,
            "transaction_type": self.transaction_type,
            "category": self.category,
            "amount": float(self.amount),
            "payment_mode": self.payment_mode,
            "reference_module": self.reference_module,
            "reference_id": self.reference_id,
            "remarks": self.remarks,
        }
