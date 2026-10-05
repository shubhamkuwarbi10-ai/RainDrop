"""Create, list and remove control-room operator accounts.

Run from the repository root:

    python backend/scripts/manage_operators.py add --username chennai.ops \
        --name "GCC Control Room" --cities chennai
    python backend/scripts/manage_operators.py list
    python backend/scripts/manage_operators.py remove --username chennai.ops

The password is read from a prompt or from the RAINDROP_NEW_OPERATOR_PASSWORD
environment variable. It is never taken from the command line, where it would
land in shell history and in the process table.
"""
from __future__ import annotations

import argparse
import getpass
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core import config  # noqa: E402
from app.core.paths import OPERATORS_FILE  # noqa: E402
from app.core.security import upsert_operator  # noqa: E402

MIN_PASSWORD_LENGTH = 12


def _read_password() -> str:
    from_env = os.getenv("RAINDROP_NEW_OPERATOR_PASSWORD")
    if from_env:
        return from_env
    first = getpass.getpass("New operator password: ")
    second = getpass.getpass("Confirm password: ")
    if first != second:
        raise SystemExit("Passwords did not match.")
    return first


def cmd_add(args: argparse.Namespace) -> int:
    password = _read_password()
    if len(password) < MIN_PASSWORD_LENGTH:
        raise SystemExit(f"Password must be at least {MIN_PASSWORD_LENGTH} characters.")
    cities = tuple(args.cities) if args.cities else config.FOCUS_CITIES
    operator = upsert_operator(
        args.username,
        password,
        display_name=args.name or args.username,
        role=args.role,
        cities=cities,
    )
    print(f"Saved operator '{operator.username}' (role={operator.role}, cities={', '.join(operator.cities)})")
    print(f"Store: {OPERATORS_FILE}")
    return 0


def cmd_list(_: argparse.Namespace) -> int:
    if not OPERATORS_FILE.is_file():
        print("No operator store yet. Create one with the 'add' command.")
        return 0
    store = json.loads(OPERATORS_FILE.read_text(encoding="utf-8"))
    entries = store.get("operators", [])
    if not entries:
        print("No operator accounts configured.")
        return 0
    for entry in entries:
        print(f"{entry['username']:<24} {entry.get('role', 'operator'):<10} {', '.join(entry.get('cities', []))}")
    return 0


def cmd_remove(args: argparse.Namespace) -> int:
    if not OPERATORS_FILE.is_file():
        raise SystemExit("No operator store exists.")
    store = json.loads(OPERATORS_FILE.read_text(encoding="utf-8"))
    before = len(store.get("operators", []))
    store["operators"] = [
        entry for entry in store.get("operators", []) if entry.get("username") != args.username.strip().lower()
    ]
    if len(store["operators"]) == before:
        raise SystemExit(f"No such operator: {args.username}")
    OPERATORS_FILE.write_text(json.dumps(store, indent=2), encoding="utf-8")
    print(f"Removed operator '{args.username}'.")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Manage RainDrop control-room operator accounts.")
    sub = parser.add_subparsers(dest="command", required=True)

    add = sub.add_parser("add", help="Create or replace an operator account.")
    add.add_argument("--username", required=True)
    add.add_argument("--name", help="Display name shown in the console header.")
    add.add_argument("--role", default="operator", choices=["operator", "supervisor"])
    add.add_argument(
        "--cities",
        nargs="*",
        help=f"Cities this account may act on. Default: {' '.join(config.FOCUS_CITIES)}. Use '*' for all.",
    )
    add.set_defaults(func=cmd_add)

    listing = sub.add_parser("list", help="List configured operator accounts.")
    listing.set_defaults(func=cmd_list)

    remove = sub.add_parser("remove", help="Delete an operator account.")
    remove.add_argument("--username", required=True)
    remove.set_defaults(func=cmd_remove)

    return parser


if __name__ == "__main__":
    parsed = build_parser().parse_args()
    raise SystemExit(parsed.func(parsed))
