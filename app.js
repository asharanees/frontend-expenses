
async function fetchExpenses() {
    console.log("Button clicked");
  const userId = document.getElementById('userId').value;
  const start = document.getElementById('start').value;
  const end = document.getElementById('end').value;
  const category = document.getElementById('category').value;

  const params = new URLSearchParams({ userId });
  if (start) params.append('start', start + 'T00:00');
  if (end) params.append('end', end + 'T23:59');
  if (category) params.append('category', category);

 const apiUrl = "https://ylgl5p7917.execute-api.us-east-1.amazonaws.com/prod";
 const res = await fetch(`${apiUrl}/expenses?${params.toString()}`);
  
  const data = await res.json();

  document.getElementById('summary').textContent =
    `Total: ${data.totalAmount} | Count: ${data.count}`;

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

const poolData = {
  UserPoolId: 'us-east-1_AmVAfOyNM',
  ClientId: '6uetlptr2vqff5dif1ncoh7v5'
};
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

}