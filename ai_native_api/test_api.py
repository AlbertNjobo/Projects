import requests

def test_get_items():
    response = requests.get("http://127.0.0.1:8000/items")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_post_item():
    item = {"name": "Test Item", "description": "A test item."}
    response = requests.post("http://127.0.0.1:8000/items", json=item)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == item["name"]
    assert data["description"] == item["description"]

if __name__ == "__main__":
    test_get_items()
    test_post_item()
    print("All tests passed.")
