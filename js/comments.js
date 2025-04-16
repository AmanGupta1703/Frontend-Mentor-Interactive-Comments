import { loadComments } from "./fetch-comments.js";
import {
  fetchDataFromLocalStorage,
  saveDataToLocalStorage,
  createNewCommentObject,
  find,
  findByIdAndDelete,
} from "./utils.js";

// --------------------------------------
// DOM Elements
// --------------------------------------
const mainWrapperEl = document.querySelector(".main-wrapper");
const commentsEl = document.querySelector(".comments");
const popupContainerEl = document.querySelector(".popup-container");

// --------------------------------------
// Inital State
// --------------------------------------
let comments = [];
let currentUser = {};
let score = 0;
let isReplying = false;
let replyCommentObj = {};
let data = null;

// --------------------------------------
// Render Comments
// --------------------------------------
function renderComments(comments) {
  commentsEl.innerHTML = "";
  commentsEl.insertAdjacentHTML(
    "beforeend",
    comments.map(createCommentHTML).join("")
  );
}

function createActionButtonsHTML(username, isCurrentUser) {
  if (isCurrentUser) {
    return `
      <button class="btn btn-action btn-delete">
        <img class="btn-delete-icon" src="./images/icon-delete.svg">
        Delete
      </button>
      <button class="btn btn-action btn-edit">
        <img class="btn-edit-icon" src="./images/icon-edit.svg">
        Edit
      </button>
    `;
  } else {
    return `
      <button class="btn btn-action btn-reply">
        <img class="btn-reply-icon" src="./images/icon-reply.svg">
        Reply
      </button>
    `;
  }
}

function createLikeCounterHTML(id, username, score) {
  return `
    <div class="like-counter" data-username="${username}" data-id="${id}">
      <button class="btn btn-counter btn-add">
        <img class="btn-add-icon" src="./images/icon-plus.svg" />
      </button>
      <span class="like-count">${score}</span>
      <button class="btn btn-counter btn-minus">
        <img class="btn-minus-icon" src="./images/icon-minus.svg" />
      </button>
    </div>
  `;
}

function createMetaHTML(username, image, createdAt, isCurrentUser) {
  return `
    <img class="comment-avatar" src="${
      image.webp
    }" alt="avatar of ${username}" />
    <span class="comment-username">
      ${username}
      ${isCurrentUser ? `<span class="badge badge-primary">you</span>` : ""}
    </span>
    <span class="comment-created">${createdAt}</span>
  `;
}

function createCommentTextHTML(replyingTo, content) {
  return `
    ${
      replyingTo
        ? `<span class="comment-text-username">${replyingTo}</span> `
        : ""
    }
    <span class="comment-text-value">${content}</span>
  `;
}

function createCommentHTML(comment, index) {
  const {
    id,
    content,
    createdAt,
    score,
    replyingTo,
    user: { image, username },
    replies,
  } = comment;

  const isCurrentUser = currentUser.username === username;
  let html = "";

  html += `
    <div class="comment-container">
      <article class="comment" data-id="${id}" data-username="${username}" data-type="${
    replyingTo ? "reply" : "comment"
  }">
        <div class="comment-wrapper">
          ${createLikeCounterHTML(id, username, score)}
          <div class="comment-body">
            <div class="comment-meta">
              <div class="comment-meta-data">
                ${createMetaHTML(username, image, createdAt, isCurrentUser)}
              </div>
              <div class="button-actions" data-username="${username}">
                ${createActionButtonsHTML(username, isCurrentUser)}
              </div>
            </div>
            <p class="comment-text">
             ${createCommentTextHTML(replyingTo, content)}
          </div>
        </div>
      </article>
  `;

  if (replies?.length) {
    html += `
      <article class="replies">
        <div class="replies-wrapper">${replies
          ?.map(createCommentHTML)
          .join("")}</div>
        <div class="thread"></div>
      </article>
    </div>
    `;
  } else {
    html += "</div>";
  }

  return html;
}

// --------------------------------------
// Add Comment
// --------------------------------------
function renderAddCommentBox(
  currentUser = {},
  container = mainWrapperEl,
  type = "add-comment",
  replyingTo = ""
) {
  if (!currentUser) return;

  const addCommentEl = document.createElement("article");
  addCommentEl.setAttribute("class", "add-comment");

  addCommentEl.insertAdjacentHTML(
    "afterbegin",
    createAddCommentForm(currentUser, replyingTo)
  );

  container.insertAdjacentElement("beforeend", addCommentEl);
}

function createAddCommentForm(currentUser, replyingTo) {
  const { image, username } = currentUser;

  return `
    <div class="add-comment-box">
      <img
        alt="avatar of ${username}"
        class="add-comment-avatar"
        src="${image.webp}"
      />
      <form class="form form-add-comment">
        <textarea
          name="comment"
          placeholder="Add a comment..."
          rows="4"
          class="textarea textarea-comment"
        ></textarea>
        <button class="btn btn-form btn-add-comment">${
          replyingTo ? "Reply" : "Send"
        }</button>
      </form>
    </div>
  `;
}

// --------------------------------------
// Handle Form Submit
// --------------------------------------
function handleAddCommentFormSubmit(
  data,
  comments,
  textareaCommentEl,
  currentUser,
  replyingTo
) {
  const textareaCommentValue = textareaCommentEl.value;

  if (!textareaCommentValue) return;

  const newCommentObject = createNewCommentObject(
    textareaCommentValue,
    currentUser,
    replyingTo
  );

  comments.push(newCommentObject);

  renderComments(data?.comments);
  saveDataToLocalStorage(data);

  textareaCommentEl.value = "";

  if (replyingTo) {
    isReplying = false;
    replyCommentObj = null;
  }
}

// --------------------------------------
// Handle Like Counter
// --------------------------------------
function handleAddLikeScore(userCommentData, loggedInUser, likeCountEl) {
  if (!userCommentData || !loggedInUser) return;

  if (userCommentData.id === loggedInUser.id) return;

  if (userCommentData?.likeBy && userCommentData.likeBy.length) {
    if (userCommentData.likeBy.some((id) => id === loggedInUser.id)) return;
  }

  score += 1;
  userCommentData.score = score;

  userCommentData.likeBy.push(loggedInUser.id);

  likeCountEl.textContent = score;
}

function handleDislikeScore(userCommentData, loggedInUser, likeCountEl) {
  if (!userCommentData || !loggedInUser) return;

  if (userCommentData.id === loggedInUser.id) return;

  if (userCommentData?.likeBy && userCommentData.likeBy.length) {
    const index = userCommentData.likeBy.findIndex(
      (id) => id === loggedInUser.id
    );
    if (index !== -1) {
      userCommentData.likeBy.splice(index, 1);
      score -= 1;
      userCommentData.score = score;
      likeCountEl.textContent = score;
    }
  }
}

function handleLikeCounterInteraction(btnCounter, loggedInUser, data) {
  const likeCounterContainerEl = btnCounter.parentElement;
  const username = likeCounterContainerEl.getAttribute("data-username");
  const likeCountEl = likeCounterContainerEl.querySelector(".like-count");

  if (!username || !loggedInUser) return;

  const userCommentData = find(comments, username);

  if (!userCommentData) return;

  score = userCommentData.score;
  userCommentData.likeBy = userCommentData.likeBy?.length
    ? userCommentData.likeBy
    : [];

  if (btnCounter.classList.contains("btn-add")) {
    handleAddLikeScore(userCommentData, loggedInUser, likeCountEl);
  }

  if (btnCounter.classList.contains("btn-minus")) {
    handleDislikeScore(userCommentData, loggedInUser, likeCountEl);
  }

  saveDataToLocalStorage(data);
}

// --------------------------------------
// Handle Comment Edit
// --------------------------------------
function handleCommentEdit(btnEdit, data) {
  const commentBodyEl = btnEdit.closest(".comment-body");
  const commentTextEl = commentBodyEl.querySelector(".comment-text");

  commentTextEl.contentEditable = true;

  const commentToEdit = find(
    comments,
    Number(btnEdit.closest(".comment").getAttribute("data-id"))
  );

  function handleCommentChange(ev) {
    const editCommentTextValue = ev.target.querySelector(
      ".comment-text-value"
    ).innerText;
    commentToEdit.content = editCommentTextValue;
    commentTextEl.contentEditable = false;
    saveDataToLocalStorage(data);
  }

  commentTextEl.addEventListener("blur", handleCommentChange);
}

function handleReplyButtonClick(btnReply) {
  const commentBoxEl = btnReply.closest(".comment");
  const commentContainerEl = btnReply.closest(".comment-container");
  const replyingTo = commentBoxEl.getAttribute("data-username");

  const userDetails = find(comments, replyingTo);

  isReplying = true;
  replyCommentObj = userDetails;

  const addCommentEl = commentContainerEl.querySelector(".add-comment");

  if (!addCommentEl) {
    renderAddCommentBox(
      currentUser,
      commentContainerEl,
      "reply",
      userDetails.user.username
    );
  }
}

// --------------------------------------
// Handle Comment Delete
// --------------------------------------
function handleDeleteComment(btnDelete) {
  const commentEl = btnDelete.closest(".comment");

  popupContainerEl.classList.remove("hide");

  if (!popupContainerEl.classList.contains("hide")) {
    popupContainerEl.addEventListener("click", function (ev) {
      const btnDanger = ev.target.closest(".btn-danger");

      if (btnDanger) {
        comments = findByIdAndDelete(
          comments,
          Number(commentEl.getAttribute("data-id"))
        );
        renderComments(comments);
        saveDataToLocalStorage(data);
      }

      popupContainerEl.classList.add("hide");
    });
  }
}

// --------------------------------------
// Handle Form Submission
// --------------------------------------
function handleFormSubmission(ev) {
  ev.preventDefault();

  // ev -> form element
  // ev.target.comment -> form > textarea

  if (ev.target.classList.contains("form-add-comment")) {
    if (!isReplying) {
      handleAddCommentFormSubmit(
        data,
        comments,
        ev.target.comment,
        currentUser
      );
      return;
    }

    handleAddCommentFormSubmit(
      data,
      replyCommentObj.replies,
      ev.target.comment,
      currentUser,
      replyCommentObj.user.username
    );
  }
}

// --------------------------------------
// Initialization
// --------------------------------------
async function init() {
  data = fetchDataFromLocalStorage();

  if (!data) {
    data = await loadComments();
  }

  if (!data) return;

  comments = data.comments;
  currentUser = data.currentUser;
  renderComments(data.comments);
  renderAddCommentBox(data.currentUser);
  saveDataToLocalStorage(data);

  window.addEventListener("click", function (ev) {
    const btnCounter = ev.target.closest(".btn-counter");
    const btnReply = ev.target.closest(".btn-reply");
    const btnDelete = ev.target.closest(".btn-delete");
    const btnEdit = ev.target.closest(".btn-edit");

    const loggedInUser = find(comments, currentUser.username);

    if (btnCounter) {
      handleLikeCounterInteraction(btnCounter, loggedInUser, data);
    } else if (btnReply) {
      handleReplyButtonClick(btnReply);
    } else if (btnDelete) {
      handleDeleteComment(btnDelete);
    } else if (btnEdit) {
      handleCommentEdit(btnEdit, data);
    }
  });

  window.addEventListener("submit", handleFormSubmission);
}

init();
