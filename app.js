import {
  CognitoUserPool,
  AuthenticationDetails,
  CognitoUser
} from "https://esm.sh/amazon-cognito-identity-js";

document.addEventListener("DOMContentLoaded", function () {
  // 🔐 Cognito setup
  const poolData = {
    UserPoolId: 'us-east-1_EJvPz2V94',
    ClientId: '5mv8nvan2r45b02p9jdpo8q8tt'
  };
  const userPool = new CognitoUserPool(poolData);

//  landing page button logic
document.getElementById("goToLogin").addEventListener("click", () => {
  document.getElementById("landingSection").style.display = "none";
  document.getElementById("signupSection").style.display = "none";
  document.getElementById("loginSection").style.display = "block";
});

document.getElementById("goToSignup").addEventListener("click", () => {
  document.getElementById("landingSection").style.display = "none";
  document.getElementById("signupSection").style.display = "block";
  document.getElementById("loginSection").style.display = "none";
});



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
        // fetchExpenses(); // Optional: Fetch after login
         document.getElementById("loginSection").style.display = "none";
        document.getElementById("expenseSection").style.display = "block";
        document.getElementById("addExpenseSection").style.display = "block";
      },
      onFailure: (err) => {
        console.error("Login failed:", err.message || JSON.stringify(err));
        alert("Login error: " + err.message);
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        const newPassword = prompt("New password required. Please enter a new one:");
        cognitoUser.completeNewPasswordChallenge(newPassword, {}, {
          onSuccess: (result) => {
            const idToken = result.getIdToken().getJwtToken();
            console.log("Password updated. New JWT:", idToken);
            window.userToken = idToken;
            // fetchExpenses(); // Optional: Fetch after password change
          },
          onFailure: (err) => {
            console.error("Password update failed:", err.message || JSON.stringify(err));
            alert("Password update error: " + err.message);
          }
        });
      }
    });
  });

  

// signup button logic


document.getElementById("signupBtn").addEventListener("click", () => {
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }
userPool.signUp(email, password, [], null, (err, result) => {
  if (err) {
    console.error("Signup error:", err.message || err);
    alert("Signup failed: " + err.message);
  } else {
    console.log("Signup success:", result);
    alert("Signup successful! Please check your email for the verification code.");

    const confirmationCode = prompt("Enter the verification code from your email:");
    const cognitoUser = result.user;

    cognitoUser.confirmRegistration(confirmationCode, true, (err, success) => {
      if (err) {
        console.error("Confirmation error:", err.message);
        alert("Verification failed: " + err.message);
      } else {
        alert("Account confirmed! You may now log in.");
        // Optional: Switch to login section
        document.getElementById("signupSection").style.display = "none";
        document.getElementById("loginSection").style.display = "block";
      }
    });
  }
});

});

document.getElementById("resendBtn").addEventListener("click", () => {
  const email = document.getElementById("signupEmail").value;

  if (!email) {
    alert("Please enter your email before requesting a resend.");
    return;
  }

  const userData = {
    Username: email,
    Pool: userPool
  };

  const cognitoUser = new CognitoUser(userData);

  cognitoUser.resendConfirmationCode((err, result) => {
    if (err) {
      console.error("Resend error:", err.message || err);
      alert("Resend failed: " + err.message);
    } else {
      console.log("Resend success:", result);
      alert("Verification email resent! Please check your inbox.");

      // ✅ Prompt and confirm inside the callback
      const confirmationCode = prompt("Enter the verification code from your email:");

      cognitoUser.confirmRegistration(confirmationCode, true, (err, success) => {
        if (err) {
          console.error("Confirmation error:", err.message);
          alert("Verification failed: " + err.message);
        } else {
          alert("Account confirmed! You may now log in.");
          document.getElementById("signupSection").style.display = "none";
          document.getElementById("loginSection").style.display = "block";
        }
      });
    }
  });
});

  // 📦 Add expenses button logic

  document.getElementById("addExpenseBtn").addEventListener("click", addExpenses);
 // add expenses function
  async function addExpenses() {
    const userId = document.getElementById("expenseName").value;
    const category = document.getElementById("categoryname").value;
    const amount = parseFloat(document.getElementById("expenseAmount").value);
        

  if (!category || isNaN(amount) || !userId) {
    alert("Please fill in all fields with valid data.");
    return;
  }

  const expense = {
    userId,
    amount,
    category
   };
  
  try {
    const res = await fetch("https://ylgl5p7917.execute-api.us-east-1.amazonaws.com/hello", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${window.userToken}`
      },
      body: JSON.stringify(expense)
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    alert("Expense added successfully!");

    // Optionally refresh expense list
    // fetchExpenses(); 
  } catch (err) {
    console.error("Add expense failed:", err.message);
    alert("Failed to add expense: " + err.message);
  }
};



  // 📦 Fetch expenses button logic

 
  document.getElementById("fetchBtn").addEventListener("click", fetchExpenses);

  // 📊 Expense fetching function
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

    try {
      const res = await fetch(`${apiUrl}/expenses?${params.toString()}`, {
        headers: {
          Authorization: window.userToken
        }
      });

      const data = await res.json();
      console.log("Fetched expenses:", data);
      // ✨ Optional: Render data to the DOM here

      
  document.getElementById('summary').textContent =
    `Total: ${data.totalAmount} | Count: ${data.count}`;

  const categoryTotals = {}; // e.g., { Food: 120, Transport: 65 }

data.data.forEach(exp => {
  const cat = exp.category || "Uncategorized";
  categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;
});

const totalsContainer = document.getElementById("categoryTotals");
totalsContainer.innerHTML = "";

Object.entries(categoryTotals).forEach(([cat, amt]) => {
  const div = document.createElement("div");
  div.className = "flex justify-between p-2 bg-gray-100 rounded shadow text-sm";
  div.innerHTML = `<span>${cat}</span><span>$${amt.toFixed(2)}</span>`;
  totalsContainer.appendChild(div);
});


const labels = Object.keys(categoryTotals);
const amounts = Object.values(categoryTotals);

const ctx = document.getElementById("expenseChart").getContext("2d");

// 💥 Destroy previous chart if exists
if (window.expenseChart && typeof window.expenseChart.destroy === "function") {
  window.expenseChart.destroy();
}

window.expenseChart = new Chart(ctx, {
  type: "pie",
  data: {
    labels: Object.keys(categoryTotals),
    datasets: [{
      data: Object.values(categoryTotals),
      backgroundColor: [
        "#f87171", "#34d399", "#60a5fa", "#fbbf24", "#a78bfa", "#f472b6"
      ],
      borderColor: "#fff",
      borderWidth: 2
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      title: { display: true, text: "Category Breakdown" }
    }
  }
});


  // 🧾 Render expenses list
  
  const ul = document.getElementById('results');
  ul.innerHTML = "";
  data.data.forEach(item => {
  const li = document.createElement('li');

  // Format timestamp
  const formattedDate = new Date(item.timestamp).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  li.textContent = `${formattedDate} – ${item.category} – $${item.amount}`;
  li.className = "border p-2 rounded bg-gray-50"; // optional styling
  ul.appendChild(li);
});


    } catch (err) {
      console.error("Fetching failed:", err.message || err);
      alert("Error fetching expenses: " + err.message);
    }
  }





  




  
});
