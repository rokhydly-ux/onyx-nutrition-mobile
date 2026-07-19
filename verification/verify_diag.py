from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.wait_for_timeout(5000)
    page.goto("http://localhost:8081/diagnostic")
    page.wait_for_timeout(4000)

    page.evaluate("() => { const buttons = Array.from(document.querySelectorAll('div[role=\"button\"]')); const target = buttons.find(b => b.innerText && b.innerText.includes('Femme')); if(target) target.click(); }")
    page.wait_for_timeout(500)

    page.get_by_placeholder("Ex: 30").fill("28")
    page.wait_for_timeout(500)

    page.screenshot(path="verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="verification/videos")
        page = context.new_page()
        try:
            run_cuj(page)
        except Exception as e:
            print("Error running CUJ:", e)
            page.screenshot(path="verification/screenshots/error.png")
        finally:
            context.close()
            browser.close()
