#!/usr/bin/env python3

import requests
import json
import sys

def test_tv_api():
    base_url = "https://radiofusion.preview.emergentagent.com/api"
    
    tests = [
        ("GET TV Channel", "GET", f"{base_url}/tv/channel"),
        ("GET All TV Shows", "GET", f"{base_url}/tv/shows?category=all"),
        ("GET Variety TV Shows", "GET", f"{base_url}/tv/shows?category=variety"),
        ("GET News TV Shows", "GET", f"{base_url}/tv/shows?category=news"),
        ("GET Music TV Shows", "GET", f"{base_url}/tv/shows?category=music"),
        ("GET Talk TV Shows", "GET", f"{base_url}/tv/shows?category=talk"),
        ("GET Documentary TV Shows", "GET", f"{base_url}/tv/shows?category=documentary"),
        ("GET Comedy TV Shows", "GET", f"{base_url}/tv/shows?category=comedy"),
        ("GET TV Categories", "GET", f"{base_url}/tv/categories"),
        ("GET TV Schedule", "GET", f"{base_url}/tv/schedule"),
        ("GET Featured TV Shows", "GET", f"{base_url}/tv/featured"),
        ("GET TV Shows (Featured Filter)", "GET", f"{base_url}/tv/shows?featured=true"),
    ]
    
    passed = 0
    failed = 0
    
    print("🎬 Testing TV API Endpoints")
    print("=" * 50)
    
    for test_name, method, url in tests:
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {test_name}: {response.status_code}")
                
                # Show some details for key endpoints
                if "tv/shows" in url and isinstance(data, list):
                    print(f"   Found {len(data)} shows")
                    if data:
                        expected_shows = ["Matin Haiti Fusion TV", "Culture Kreyòl", "Compas Live Sessions"]
                        found_shows = [show.get('title', '') for show in data]
                        for expected in expected_shows:
                            if any(expected in title for title in found_shows):
                                print(f"   ✅ Found expected show: {expected}")
                
                elif "tv/categories" in url:
                    categories = data.get('categories', [])
                    print(f"   Found {len(categories)} categories")
                    for cat in categories:
                        print(f"   • {cat.get('name')} ({cat.get('id')}) - {cat.get('show_count')} shows")
                
                elif "tv/channel" in url:
                    print(f"   Channel: {data.get('name')}")
                    print(f"   Live: {data.get('is_live')}, Viewers: {data.get('viewer_count')}")
                
                elif "tv/schedule" in url and isinstance(data, list):
                    print(f"   Found {len(data)} scheduled shows")
                    for show in data[:3]:  # Show first 3
                        print(f"   • {show.get('show_title')} - {show.get('day_of_week')} {show.get('start_time')}")
                
                passed += 1
            else:
                print(f"❌ {test_name}: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                failed += 1
                
        except Exception as e:
            print(f"❌ {test_name}: Exception - {str(e)}")
            failed += 1
    
    print("\n" + "=" * 50)
    print(f"TV API Test Results:")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"Success Rate: {(passed/(passed+failed))*100:.1f}%")
    
    return failed == 0

if __name__ == "__main__":
    success = test_tv_api()
    sys.exit(0 if success else 1)