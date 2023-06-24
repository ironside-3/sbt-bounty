function extractBattleId(battleLink) {
    const url = new URL(battleLink);
    const searchParams = new URLSearchParams(url.search);
    return searchParams.get('id');
}

document.addEventListener('DOMContentLoaded', () => {
    const leaderboardTable = document.getElementById('leaderboard');
    const clearLogsBtn = document.getElementById('clearLogsBtn');

    function updateLeaderboard(battleData, battleId) {
        const { winner, player_1, player_2 } = battleData;

        console.log('API Response:', battleData);

        // Check if the necessary data is present
        if (!winner || !player_1 || !player_2) {
            console.log('Invalid battle data');
            return;
        }

        // Retrieve existing leaderboard data from local storage
        let leaderboardData = JSON.parse(localStorage.getItem('leaderboardData')) || [];

        let leaderboardIds = JSON.parse(localStorage.getItem('leaderboardIdData')) || [];

        if (leaderboardIds.includes(battleId)) return;
        leaderboardIds.push(battleId);

        // Determine the winner and loser
        let winningUsername, losingUsername;
        if (winner === player_1) {
            winningUsername = player_1;
            losingUsername = player_2;
        } else if (winner === player_2) {
            winningUsername = player_2;
            losingUsername = player_1;
        } else {
            console.log('Invalid winner');
            return;
        }

        // Check if the winner exists in leaderboard data
        const winnerIndex = leaderboardData.findIndex(data => data.username === winningUsername);
        if (winnerIndex !== -1) {
            leaderboardData[winnerIndex].wins += 1;
        } else {
            leaderboardData.push({ username: winningUsername, wins: 1, losses: 0 });
        }

        // Check if the loser exists in leaderboard data
        if (losingUsername) {
            const loserIndex = leaderboardData.findIndex(data => data.username === losingUsername);
            if (loserIndex !== -1) {
                leaderboardData[loserIndex].losses += 1;
            } else {
                leaderboardData.push({ username: losingUsername, wins: 0, losses: 1 });
            }
        }

        // Update the leaderboard table
        leaderboardTable.innerHTML = '';
        leaderboardData.forEach(data => {
            const row = leaderboardTable.insertRow();
            const usernameCell = row.insertCell();
            usernameCell.textContent = data.username;

            const winCell = row.insertCell();
            winCell.textContent = data.wins;

            const lossCell = row.insertCell();
            lossCell.textContent = data.losses;
        });

        // Store the updated leaderboard data in local storage
        localStorage.setItem('leaderboardData', JSON.stringify(leaderboardData));
        localStorage.setItem('leaderboardIdData', JSON.stringify(leaderboardIds));
    }

    const battleForm = document.getElementById('battleForm');
    const battleLinkInput = document.getElementById('battleLinkInput');

    const handleLink = (battleLink) => {
        const battleId = extractBattleId(battleLink);
        let leaderboardIds = JSON.parse(localStorage.getItem('leaderboardIdData')) || [];
        if (battleId && !leaderboardIds.includes(battleId)) { // Check if battleId exists and is not a duplicate
            fetch(`https://api2.splinterlands.com/battle/result?id=${battleId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch battle data');
                    }
                    return response.json();
                })
                .then(data => {
                    updateLeaderboard(data, battleId);
                    location.reload(); // Refresh the page
                })
                .catch(error => {
                    console.log('Error fetching battle data:', error);
                });
        } else {
            console.log('Invalid battle link or duplicate entry');
        }
    }

    battleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const battleLink = battleLinkInput.value;
        handleLink(battleLink);
        battleLinkInput.value = ''; // Clear the input field

    });

    const battleFormMultiple = document.getElementById('battleFormMultiple');
    const battleLinkTextarea = document.getElementById('battleLinkTextarea');


    battleFormMultiple.addEventListener('submit', (e) => {
        e.preventDefault();
        const text =  battleLinkTextarea.value;
        const expression = /(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/gi;
        const matches = text.match(expression);
        matches.forEach((battleLink) => {
           handleLink(battleLink);
        });
        battleLinkTextarea.value = ''; // Clear the input field

    });

    clearLogsBtn.addEventListener('click', () => {
        localStorage.removeItem('leaderboardData');
        localStorage.removeItem('leaderboardIdData');
        leaderboardTable.innerHTML = '';
    });

    // Retrieve existing leaderboard data from local storage and populate the leaderboard table
    let leaderboardData = JSON.parse(localStorage.getItem('leaderboardData')) || [];
    leaderboardData.forEach(data => {
        const row = leaderboardTable.insertRow();
        const usernameCell = row.insertCell();
        usernameCell.textContent = data.username;

        const winCell = row.insertCell();
        winCell.textContent = data.wins;

        const lossCell = row.insertCell();
        lossCell.textContent = data.losses;

        const roleCell = row.insertCell();
        const roleDropdown = document.createElement('select');
        roleDropdown.className = 'role-dropdown';
        roleDropdown.addEventListener('change', (e) => {
            data.role = e.target.value;
            localStorage.setItem('leaderboardData', JSON.stringify(leaderboardData));
        });
        ['Legendary', 'Epic', 'Rare', 'Common', 'Wanted Person'].forEach(role => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role;
            if (data.role === role) {
                option.selected = true;
            }
            roleDropdown.appendChild(option);
        });
        roleCell.appendChild(roleDropdown);
    });
        // Retrieve posts from the Hive API
    const getPosts = async () => {
        const hiveNode = 'https://api.hive.blog';
        const tag = 'sbt';
        const response = await fetch(hiveNode, {
            headers: {
                accept: 'application/json, text/plain, */*',
                'content-type': 'application/json',
            },
            referrerPolicy: 'no-referrer',
            body:
                '{"id":33,"jsonrpc":"2.0","method":"bridge.get_ranked_posts","params":{"tag":"' +
                tag +
                '","sort":"trending","limit":21,"start_author":null,"start_permlink":null,"observer":"noctury"}}',
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
        });

        const jsonData = await response.json();
        return jsonData;
    };

    // Call the getPosts function to fetch and display posts
    getPosts()
        .then((jsonData) => {
            console.log('API Response:', jsonData);
            // Process and display the fetched posts
            const postsContainer = document.getElementById('postsContainer');
            jsonData.result.forEach((post) => {
                const postElement = document.createElement('div');
                postElement.className = 'post';

                // Extract the thumbnail and title
                const thumbnail = post.json_metadata?.image[0] || ''; // Change the property based on your JSON structure
                const title = post.title;

// Create a link element with thumbnail and title
            const linkElement = document.createElement('a');
                linkElement.href = `https://hive.blog${post.url}`;
                linkElement.target = '_blank'; // Open the post in a new tab

        // Apply CSS class to the link element
                linkElement.className = 'post-link';

            linkElement.innerHTML = `
            <img src="${thumbnail}" alt="Thumbnail">
            <h5>${title}</h5>`;

// Append the link element to the post element
                postElement.appendChild(linkElement);

                // Append the post element to the container
                postsContainer.appendChild(postElement);
            });
        })
        .catch((error) => {
            console.log('Error fetching posts:', error);
        });
});
