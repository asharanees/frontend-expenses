import {
  CognitoUserPool,
  AuthenticationDetails,
  CognitoUser
} from "https://esm.sh/amazon-cognito-identity-js";

// 🔐 Cognito setup
const poolData = {
  UserPoolId: 'us-east-1_AmVAfOyNM',
  ClientId: '6uetlptr2vqff5dif1ncoh7v5'
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

      // 💡 Save token globally or in localStorage
      window.userToken = idToken;

      // Optionally auto-fetch expenses after login
      // fetchExpenses();
    },
    onFailure: (err) => {
      console.error("Login failed:", err.message || JSON.stringify(err));
      alert("Login error: " + err.message);
    }
  });
});

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
