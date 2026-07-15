from playwright.sync_api import sync_playwright
import os
import time

def run_cuj(page):
    # Wait for dev server
    page.wait_for_timeout(5000)
    page.goto("http://localhost:8081/")
    page.wait_for_timeout(4000)

    # Click S'INSCRIRE on welcome page
    page.get_by_text("S'INSCRIRE").click()
    page.wait_for_timeout(2000)

    # Step 1: Gender and Age
    page.get_by_text("Je suis une femme").click()
    page.wait_for_timeout(500)
    page.get_by_placeholder("Ex: 30").fill("28")
    page.get_by_text("Continuer").click()
    page.wait_for_timeout(1000)

    # Take screenshot of Step 2 (Objective)
    page.screenshot(path="verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

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