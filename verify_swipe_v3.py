import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 390, 'height': 844})
        page = await context.new_page()

        await page.goto("http://localhost:8081/welcome")

        print("Waiting for page load...")
        await page.wait_for_timeout(2000)

        print("Slide 1 screenshot")
        await page.screenshot(path="verification/screenshots/verification_swipe_slide1.png")

        # We'll wait for the auto-scroll instead of swiping manually.
        # It's set to 4000ms.
        print("Waiting for auto-scroll to slide 2...")
        await page.wait_for_timeout(4500)

        print("Slide 2 screenshot")
        await page.screenshot(path="verification/screenshots/verification_swipe_slide2.png")

        print("Waiting for auto-scroll to slide 3...")
        await page.wait_for_timeout(4500)

        print("Slide 3 screenshot")
        await page.screenshot(path="verification/screenshots/verification_swipe_slide3.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
