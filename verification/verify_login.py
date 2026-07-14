from playwright.sync_api import sync_playwright
import os
import time

def run_cuj(page):
    # Wait for dev server
    page.wait_for_timeout(5000)
    page.goto("http://localhost:8081/login")
    page.wait_for_timeout(4000)

    # Fill phone
    page.get_by_placeholder("Ex: 77 123 45 67").fill("78 000 00 56")
    page.wait_for_timeout(1000)

    # Fill password
    page.get_by_placeholder("••••••••").fill("secretpass")
    page.wait_for_timeout(1000)

    # Click the connect button
    page.get_by_text("C'est parti !").click()
    page.wait_for_timeout(2000)

    # Take screenshot at the key moment (showing fields filled)
    page.screenshot(path="verification/screenshots/verification.png")
    page.wait_for_timeout(1000)  # Hold final state for the video

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        except Exception as e:
            print("Error running CUJ:", e)
            page.screenshot(path="verification/screenshots/error.png")
        finally:
            context.close()  # MUST close context to save the video
            browser.close()