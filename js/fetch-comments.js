import { saveDataToLocalStorage, fetchDataFromLocalStorage } from "./utils.js";

const PATH = "../data.json";

async function loadComments() {
  const response = await fetch(PATH);
  const data = await response.json();
  return data;
}

export { loadComments };
