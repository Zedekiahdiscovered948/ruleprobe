"""Module with deliberate naming violations for testing."""


class user_service:
    """Uses snake_case instead of PascalCase."""

    def GetUserById(self, userId: int) -> dict:
        """Uses PascalCase instead of snake_case."""
        return {"id": userId, "name": "test"}

    def ValidateEmail(self, email: str) -> bool:
        """Uses PascalCase instead of snake_case."""
        return "@" in email


def CalculateTotalPrice(items: list, taxRate: float) -> float:
    """Uses PascalCase instead of snake_case."""
    subtotal = sum(item["price"] for item in items)
    return subtotal * (1 + taxRate)
