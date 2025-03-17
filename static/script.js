async function callApi(event, apiName) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch(apiName === 'get_token' ? '/get_token' : `/call_api/${apiName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(data)
        });
        
        const result = await response.json();
        const output = document.getElementById(`${apiName}-response`);
        output.textContent = JSON.stringify(result, null, 2);
        
        // Display notification messages based on API calls
        if (apiName === 'get_token' && response.ok) {
            alert('Access token acquired!');
        }
        if (apiName === 'send_reply' && response.ok) {
            alert('Reply sent successfully!');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Modal handling for API details
const modal = document.getElementById('apiModal');
const span = document.getElementsByClassName('close')[0];

function showApiDetails(apiName) {
    const apiDetails = {
        'get_teams': {
            description: 'Retrieves all teams in the organization. This endpoint returns a list of teams accessible by the authenticated user or application. In delegated scenarios, only teams that the user is a member of will be returned; in app-only scenarios, all teams are accessible.',
            url: "GET https://graph.microsoft.com/v1.0/teams",
            variables: ['None (access token is required)'],
            method: "GET",
            headers: "Authorization: Bearer <access_token>",
            response: 'Returns a JSON object containing a list of team objects.',
            notes: "Ensure your access token is valid and has proper permissions such as Team.ReadBasic.All."
        },
        'get_channels': {
            description: 'Gets all channels in a specific team. This endpoint retrieves the channels that exist within the given team.',
            url: "GET https://graph.microsoft.com/v1.0/teams/{team_id}/channels",
            variables: ['team_id (ID of the team)'],
            method: "GET",
            headers: "Authorization: Bearer <access_token>",
            response: 'Returns a JSON object containing a list of channel objects for the specified team.',
            notes: "Make sure the team_id is valid and the access token has appropriate permissions."
        },
        'get_messages': {
            description: 'Retrieves messages from a specific channel. This endpoint fetches all messages posted in the specified channel.',
            url: "GET https://graph.microsoft.com/v1.0/teams/{team_id}/channels/{channel_id}/messages",
            variables: ['team_id (ID of the team)', 'channel_id (ID of the channel)'],
            method: "GET",
            headers: "Authorization: Bearer <access_token>",
            response: 'Returns a JSON object containing a list of message objects from the channel.',
            notes: "Ensure both team_id and channel_id are correct. Be aware of pagination if the channel has many messages."
        },
        'send_message': {
            description: 'Posts a new message to a channel. Use this endpoint to send a message with optional subject, HTML content, attachments, and mentions to a team channel.',
            url: "POST https://graph.microsoft.com/v1.0/teams/{team_id}/channels/{channel_id}/messages",
            variables: ['team_id (ID of the team)', 'channel_id (ID of the channel)', 'JSON body (message payload)'],
            method: "POST",
            headers: "Authorization: Bearer <access_token>, Content-Type: application/json",
            response: 'Returns a JSON object containing the created message.',
            notes: "Ensure the JSON payload is properly formatted. For mentions, include proper <at id=\"...\"> markers in the HTML content."
        },
        'send_reply': {
            description: 'Sends a reply to a specific message in a channel. This endpoint is used to post a reply to an existing message. Replies must be sent as HTML content.',
            url: "POST https://graph.microsoft.com/v1.0/teams/{team_id}/channels/{channel_id}/messages/{message_id}/replies",
            variables: ['team_id (ID of the team)', 'channel_id (ID of the channel)', 'message_id (ID of the original message)', 'JSON reply payload'],
            method: "POST",
            headers: "Authorization: Bearer <access_token>, Content-Type: application/json",
            response: 'Returns a JSON object containing the created reply message.',
            notes: "If including mentions, ensure the reply body contains corresponding <at id=\"...\"> markers."
        }
    };

    document.getElementById('modal-title').textContent = apiName.replace(/_/g, ' ').toUpperCase();
    document.getElementById('modal-content').innerHTML = `
        <p><strong>Description:</strong> ${apiDetails[apiName].description}</p>
        <p><strong>URL:</strong> ${apiDetails[apiName].url}</p>
        <p><strong>Method:</strong> ${apiDetails[apiName].method}</p>
        <p><strong>Headers:</strong> ${apiDetails[apiName].headers}</p>
        <p><strong>Variables:</strong> ${apiDetails[apiName].variables.join(', ')}</p>
        <p><strong>Response:</strong> ${apiDetails[apiName].response}</p>
        <p><strong>Notes:</strong> ${apiDetails[apiName].notes}</p>
    `;
    modal.style.display = 'block';
}

span.onclick = () => modal.style.display = 'none';
window.onclick = (event) => {
    if (event.target === modal) modal.style.display = 'none';
}
