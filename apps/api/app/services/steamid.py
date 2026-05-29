STEAM64_BASE = 76561197960265728


def to_account_id(value: int | str) -> int:
    """Normalize a Steam identifier to a 32-bit account id.

    Accepts a 64-bit SteamID (``id - 76561197960265728``) or an already-32-bit
    account id. Raises ``ValueError`` for non-numeric input.
    """
    n = int(value)
    if n >= STEAM64_BASE:
        return n - STEAM64_BASE
    return n
