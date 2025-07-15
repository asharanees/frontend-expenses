import {
  CognitoUserPool,
  AuthenticationDetails,
  CognitoUser
} from "https://esm.sh/amazon-cognito-identity-js";

document.addEventListener("DOMContentLoaded", function () {
  const poolData = {
    UserPoolId: 'us-east-1_EJvPz2V94',
    ClientId: '5mv8nvan2r45b02p9jdpo8q8tt'
  };
  const userPool = new CognitoUserPool(poolData);

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
        document.getElementById("loginSection").style.display = "none";
        document.getElementById("expenseSection").style.display = "block";
        document.getElementById("addExpenseSection").style.display = "block";
      },
      onFailure: (err) => {
        console.error("Login failed:", err.message || JSON.stringify(err));
        alert("Login error: " + err.message);
      }
    });
  });

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
            document.getElementById("signupSection").style.display = "none";
            document.getElementById("loginSection").style.display = "block";
          }
        });
      }
    });
  });

  document.getElementById("addExpenseBtn").addEventListener("click", addExpenses);
  document.getElementById("fetchBtn").addEventListener("click", fetchExpenses);

  // Chat functionality
  document.getElementById("openChatBtn").addEventListener("click", () => {
    document.getElementById("expenseSection").style.display = "none";
    document.getElementById("addExpenseSection").style.display = "none";
    document.getElementById("chatSection").style.display = "block";
  });

  document.getElementById("sendChatBtn").addEventListener("click", sendChatMessage);
  document.getElementById("chatInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendChatMessage();
  });

  document.getElementById("goBackToExpenses").addEventListener("click", () => {
    document.getElementById("chatSection").style.display = "none";
    document.getElementById("expenseSection").style.display = "block";
    document.getElementById("addExpenseSection").style.display = "block";
  });

  async function addExpenses() {
    const userId = document.getElementById("username").value;
    const category = document.getElementById("addcategory").value;
    const amount = parseFloat(document.getElementById("expenseAmount").value);

    if (!category || isNaN(amount) || !userId) {
      alert("Please fill in all fields with valid data.");
      return;
    }

    const expense = { userId, amount, category };

    try {
      const res = await fetch("https://ylgl5p7917.execute-api.us-east-1.amazonaws.com/prod/hello", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: window.userToken
        },
        body: JSON.stringify(expense)
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      alert("Expense added successfully!");
    } catch (err) {
      console.error("Add expense failed:", err.message);
      alert("Failed to add expense: " + err.message);
    }
  }

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
        headers: { Authorization: window.userToken }
      });

      const data = await res.json();
      document.getElementById('summary').textContent = `Total: ${data.totalAmount} | Count: ${data.count}`;

      const categoryTotals = {};
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

      const ctx = document.getElementById("expenseChart").getContext("2d");
      if (window.expenseChart && typeof window.expenseChart.destroy === "function") {
        window.expenseChart.destroy();
      }

      window.expenseChart = new Chart(ctx, {
        type: "pie",
        data: {
          labels: Object.keys(categoryTotals),
          datasets: [{
            data: Object.values(categoryTotals),
            backgroundColor: ["#f87171", "#34d399", "#60a5fa", "#fbbf24", "#a78bfa", "#f472b6"],
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

      const ul = document.getElementById('results');
      ul.innerHTML = "";
      data.data.forEach(item => {
        const li = document.createElement('li');
        const formattedDate = new Date(item.timestamp).toLocaleString("en-US", {
          year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });
        li.textContent = `${formattedDate} – ${item.category} – $${item.amount}`;
        li.className = "border p-2 rounded bg-gray-50";
        ul.appendChild(li);
      });
    } catch (err) {
      console.error("Fetching failed:", err.message || err);
      alert("Error fetching expenses: " + err.message);
    }
  }

  async function sendChatMessage() {
    const input = document.getElementById("chatInput");
    const message = input.value.trim();
    
    if (!message) return;
    
    addChatMessage(message, "user");
    input.value = "";
    
    try {
      const response = await mockLexResponse(message);
      addChatMessage(response, "bot");
    } catch (error) {
      addChatMessage("Sorry, I'm having trouble right now. Please try again.", "bot");
    }
  }
  
  function addChatMessage(message, sender) {
    const chatMessages = document.getElementById("chatMessages");
    const messageDiv = document.createElement("div");
    messageDiv.className = `mb-2 p-2 rounded ${sender === "user" ? "bg-blue-100 ml-8" : "bg-gray-100 mr-8"}`;
    messageDiv.innerHTML = `<strong>${sender === "user" ? "You" : "Bot"}:</strong> ${message}`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  async function mockLexResponse(message) {
    if (message.toLowerCase().includes("spent") || message.toLowerCase().includes("expense")) {
      const amountMatch = message.match(/\$(\d+(?:\.\d{2})?)/);  
      const amount = amountMatch ? amountMatch[1] : "unknown";
      return `Got it! I've recorded your expense of $${amount}. You can also add expenses using the form above.`;
    }
    
    if (message.toLowerCase().includes("show") || message.toLowerCase().includes("expenses")) {
      return "You can view your expenses using the 'Get Expenses' button above. I can also help you add new expenses!";
    }
    
    return "I can help you track expenses! Try saying 'I spent $20 on food' or 'Show my expenses'.";
  }
});