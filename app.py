from flask import Flask, render_template, request, session
import requests
import json

app = Flask(__name__)
app.secret_key = "your_secret_key_here"  # Replace with an actual secret key

# API configuration for different Microsoft Graph endpoints
APIS = {
    "get_token": {
        "method": "POST",
        "url": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
        "description": "Get access token for authentication",
        "variables": ["tenant", "client_id", "client_secret", "refresh_token"],
        "headers": {"Content-Type": "application/x-www-form-urlencoded"},
    },
    "get_teams": {
        "method": "GET",
        "url": "https://graph.microsoft.com/v1.0/teams",
        "description": "Get list of all teams",
        "variables": [],
    },
    "get_channels": {
        "method": "GET",
        "url": "https://graph.microsoft.com/v1.0/teams/{team_id}/channels",
        "description": "Get channels in a team",
        "variables": ["team_id"],
    },
    "get_messages": {
        "method": "GET",
        "url": "https://graph.microsoft.com/v1.0/teams/{team_id}/channels/{channel_id}/messages",
        "description": "Get messages in a channel",
        "variables": ["team_id", "channel_id"],
    },
    "send_message": {
        "method": "POST",
        "url": "https://graph.microsoft.com/v1.0/teams/{team_id}/channels/{channel_id}/messages",
        "description": "Send message to a channel",
        "variables": ["team_id", "channel_id"],
        "body": True,
    },
    "send_reply": {
        "method": "POST",
        "url": "https://graph.microsoft.com/v1.0/teams/{team_id}/channels/{channel_id}/messages/{message_id}/replies",
        "description": "Send reply to a message",
        "variables": ["team_id", "channel_id", "message_id"],
        "body": True,
    },
}


@app.route("/")
def index():
    return render_template("index.html", apis=APIS)


@app.route("/get_token", methods=["POST"])
def get_token():
    data = {
        "client_id": request.form["client_id"],
        "client_secret": request.form["client_secret"],
        "refresh_token": request.form["refresh_token"],
        "grant_type": "refresh_token",
        "scope": "https://graph.microsoft.com/.default",
    }

    tenant = request.form["tenant"]
    token_url = f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"

    response = requests.post(
        token_url,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    if response.status_code == 200:
        token = response.json().get("access_token")
        session["access_token"] = token
        # Return a message indicating that the token was acquired
        return (
            json.dumps({"message": "Access token acquired!", "access_token": token}),
            200,
            {"Content-Type": "application/json"},
        )
    return {"error": response.text}, response.status_code


@app.route("/call_api/<api_name>", methods=["POST"])
def call_api(api_name):
    if "access_token" not in session:
        return {"error": "No access token found"}, 401

    api_config = APIS.get(api_name)
    if not api_config:
        return {"error": "API configuration not found"}, 404

    url = api_config["url"]

    # Replace URL parameters using the provided form data
    for var in api_config["variables"]:
        url = url.replace(f"{{{var}}}", request.form.get(var, ""))

    headers = {
        "Authorization": f'Bearer {session["access_token"]}',
        "Content-Type": "application/json",
    }

    try:
        if api_config["method"] == "GET":
            response = requests.get(url, headers=headers)
        elif api_config["method"] == "POST":
            body_data = request.form.get("body", "{}")
            try:
                body = json.loads(body_data)
            except Exception:
                body = {}
            response = requests.post(url, headers=headers, json=body)

        # Return JSON response if available, else return status code
        return response.json() if response.content else {"status": response.status_code}
    except Exception as e:
        return {"error": str(e)}, 500


if __name__ == "__main__":
    app.run(debug=True)
