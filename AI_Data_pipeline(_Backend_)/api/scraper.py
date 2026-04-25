import requests
from fastapi import APIRouter, HTTPException
router = APIRouter()
SCRAPER_API_KEY = "your_scraper_api_key_here"
@router.get("/scrape")
def scrape(url: str):
    api_url = f"https://api.scraperapi.com?api_key={SCRAPER_API_KEY}&url={url}"
    try:
        response = requests.get(api_url)
        response.raise_for_status()
        return {"content": response.text}
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=str(e))
if __name__ == "__main__":
    test_url = "https://www.example.com"
    print(scrape(test_url))
    print("Scraping completed successfully.")