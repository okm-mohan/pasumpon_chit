"""Split the generated 5×5 portrait sheet and assign each portrait to an SM26 member."""

from pathlib import Path

from PIL import Image
from sqlalchemy import text

from app.database import engine


SOURCE = Path(r"C:\Users\Admin\.codex\generated_images\019fc767-ba7a-7241-bfe3-c2e8e2012c00\exec-491bbb39-551c-4767-8325-a090c9d46c63.png")
OUTPUT = Path("app/static/images/member_profiles")


def main():
    if not SOURCE.exists():
        raise FileNotFoundError(f"Generated portrait sheet was not found: {SOURCE}")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    image = Image.open(SOURCE).convert("RGB")
    width, height = image.size
    # The prompt requested a perfectly regular 5×5 contact sheet. Cropping from
    # the proportional grid keeps the small white gutters outside each portrait.
    for row in range(5):
        for column in range(5):
            index = row * 5 + column + 1
            left = round(column * width / 5) + 3
            top = round(row * height / 5) + 3
            right = round((column + 1) * width / 5) - 3
            bottom = round((row + 1) * height / 5) - 3
            portrait = image.crop((left, top, right, bottom)).resize((420, 420), Image.Resampling.LANCZOS)
            portrait.save(OUTPUT / f"sm26_{index:02d}.jpg", quality=91, optimize=True)

    with engine.begin() as conn:
        for index in range(1, 26):
            conn.execute(text("UPDATE members SET photo=:photo WHERE member_code=:code"), {
                "photo": f"/static/images/member_profiles/sm26_{index:02d}.jpg",
                "code": f"SM26{index:03d}",
            })
    print("Created and assigned 25 individual profile photos.")


if __name__ == "__main__":
    main()
