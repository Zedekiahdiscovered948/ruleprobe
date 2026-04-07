"""Utility functions following Python conventions."""


class UserService:
    """Handles user-related operations."""

    def get_user_by_id(self, user_id: int) -> dict:
        """Retrieve a user by their unique identifier."""
        return {"id": user_id, "name": "test"}

    def validate_email(self, email: str) -> bool:
        """Check whether an email address is valid."""
        return "@" in email


def calculate_total_price(items: list, tax_rate: float) -> float:
    """Sum item prices and apply tax."""
    subtotal = sum(item["price"] for item in items)
    return subtotal * (1 + tax_rate)


def format_display_name(first_name: str, last_name: str) -> str:
    """Build a display name from first and last name."""
    return f"{first_name} {last_name}"
