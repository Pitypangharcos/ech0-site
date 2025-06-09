// Firebase setup (assumes already initialized)
const db = firebase.firestore();
const feedEl = document.getElementById("feed");

function displayPost(postData) {
  const postEl = document.createElement("div");
  postEl.className = "post";
  const likeCount = postData.likes || 0;

  postEl.innerHTML = `
    <div class="username">@${postData.username || "anonymous"}</div>
    ${postData.originalText}
    <div class="feedback">${postData.feedbackTip || ""}</div>
    <div class="likes" style="margin-top: 0.5em; color: #ccc;">❤️ ${likeCount} like${likeCount === 1 ? "" : "s"}</div>
  `;

  feedEl.prepend(postEl);
}

function fetchPosts() {
  db.collection("posts")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get()
    .then(snapshot => {
      feedEl.innerHTML = "";
      snapshot.forEach(doc => {
        displayPost(doc.data());
      });
    })
    .catch(err => {
      console.error("Error loading posts:", err);
    });
}

function simulateLikes() {
  db.collection("posts")
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();
        const editWeight = data.wasEdited ? 2 : 1;
        const randomLikes = Math.floor(Math.random() * 4 * editWeight); // 0-3 or 0-7 likes
        db.collection("posts").doc(doc.id).update({
          likes: (data.likes || 0) + randomLikes
        });
      });
    });
}

// Run once at load to fetch
fetchPosts();

// Optional: simulateLikes() could be triggered on a timer or admin button
