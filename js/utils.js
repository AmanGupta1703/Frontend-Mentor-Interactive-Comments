function saveDataToLocalStorage(data) {
  if (!data) return;
  localStorage.setItem("data", JSON.stringify(data));
}

function fetchDataFromLocalStorage() {
  return JSON.parse(localStorage.getItem("data"));
}

function createNewCommentObject(commentContent, currentUser, replyingTo) {
  return {
    id: Date.now(),
    content: commentContent,
    createdAt: "just now",
    score: 0,
    replyingTo: replyingTo ? replyingTo : null,
    user: {
      image: currentUser.image,
      username: currentUser.username,
    },
    replies: [],
  };
}

function find(data = [], findBy = "") {
  if (!findBy || !data.length) return;

  for (let i = 0; i < data?.length; i++) {
    const item = data[i];

    const findCondition =
      typeof findBy === "string"
        ? item.user.username === findBy
        : item.id === findBy;

    if (findCondition) {
      return item;
    }

    if (item.replies && item.replies.length > 0) {
      const found = find(item.replies, findBy);
      if (found !== null) {
        return found;
      }
    }
  }

  return null;
}

function findByIdAndDelete(data = [], findBy = "") {
  if (!findBy) return;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    if (item.id === findBy) {
      data.splice(i, 1);
      return data;
    }

    if (item.replies && item.replies.length > 0) {
      const updatedReplies = findByIdAndDelete(item.replies, findBy);
      if (updatedReplies) {
        item.replies = updatedReplies;
        return data;
      }
    }
  }

  return null;
}

export {
  saveDataToLocalStorage,
  fetchDataFromLocalStorage,
  createNewCommentObject,
  find,
  findByIdAndDelete,
};
