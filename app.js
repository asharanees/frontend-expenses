import {
  CognitoUserPool,
  AuthenticationDetails,
  CognitoUser
} from "https://esm.sh/amazon-cognito-identity-js";

// 🔐 Cognito setup
const poolData = {
  UserPoolId: 'us-east-1_EJvPz2V94',
  ClientId: '5mv8nvan2r45b02p9jdpo8q8tt'
};
const userPool = new CognitoUserPool(poolData);

// 🧠 Login button logic
document.getElementById("loginBtn").addEventListener("click", () => {
  const username = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;

  const authDetails = new AuthenticationDetails({
    Username: username,
    Password: password
  });

  const userData = {
    Username: username,
    Pool: userPool
  };

  const cognitoUser = new CognitoUser(userData);

cognitoUser.authenticateUser(authDetails, {
  onSuccess: (result) => {
    const idToken = result.getIdToken().getJwtToken();
    console.log("Login successful! JWT:", idToken);
    window.userToken = idToken;
    // fetchExpenses();
  },
  onFailure: (err) => {
    console.error("Login failed:", err.message || JSON.stringify(err));
    alert("Login error: " + err.message);
  },
  newPasswordRequired: (userAttributes, requiredAttributes) => {
    // You can prompt user for new password here
    const newPassword = prompt("New password required. Please enter a new one:");

    cognitoUser.completeNewPasswordChallenge(newPassword, {}, {
      onSuccess: (result) => {
        const idToken = result.getIdToken().getJwtToken();
        console.log("Password updated. New JWT:", idToken);
        window.userToken = idToken;
        // fetchExpenses();
      },
      onFailure: (err) => {
        console.error("Password update failed:", err.message || JSON.stringify(err));
        alert("Password update error: " + err.message);
      }
    });
  }
});

});
document.getElementById("fetchBtn").addEventListener("click", fetchExpenses);
// 📦 Expense fetching function
async function fetchExpenses() {
  const userId = document.getElementById('userId').value;
  const start = document.getElementById('start').value;
  const end = document.getElementById('end').value;
  const category = document.getElementById('category').value;

  const params = new URLSearchParams({ userId });
  if (start) params.append('start', start + 'T00:00');
  if (end) params.append('end', end + 'T23:59');
  if (category) params.append('category', category);

  const apiUrl = "https://ylgl5p7917.execute-api.us-east-1.amazonaws.com/prod";

  const res = await fetch(`${apiUrl}/expenses?${params.toString()}`, {
    headers: {
      Authorization: window.userToken // ⬅️ token from login
    }
  });




  const data = await res.json();
  console.log("Fetched expenses:", data);
  // 📊 Add code here to display results to the user
}
