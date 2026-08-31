const page = (location.pathname.match(/(cli|py|linux|english)\.html$/) || [])[1];

function escapeHtml(str) {
	const div = document.createElement('div');
	div.textContent = str;
	return div.innerHTML;
}

function hideAnswer(answerText) {
	answerText.style.visibility = 'hidden';
}

function equalizeHeights() {
	document.querySelectorAll('.content__item').forEach((item) => {
		const questionText = item.querySelector('.question-text');
		const answerText = item.querySelector('.answer-text');
		if (!questionText || !answerText) return;

		questionText.style.height = 'auto';
		answerText.style.height = 'auto';
		const height = Math.max(questionText.offsetHeight, answerText.offsetHeight);
		questionText.style.height = height + 'px';
		answerText.style.height = height + 'px';
	});
}

function updateNumbers() {
	const items = document.querySelectorAll('.content__item');
	const total = items.length;
	items.forEach((item) => {
		const num = item.dataset.num || '1';
		const qNum = item.querySelector('.q-num');
		const aNum = item.querySelector('.a-num');
		if (qNum) qNum.textContent = 'Question ' + num + ' of ' + total;
		if (aNum) aNum.textContent = 'Answer ' + num + ' of ' + total;
	});
}

document.addEventListener('click', (e) => {
	const btn = e.target.closest('.btn-show-hide');
	if (!btn) return;
	const answerText = btn
		.closest('.content__item')
		.querySelector('.answer-text');
	answerText.style.visibility =
		answerText.style.visibility === 'hidden' ? 'visible' : 'hidden';
	equalizeHeights();
});

function showQuestionAt(index) {
	const items = Array.from(document.querySelectorAll('.content__item'));
	if (!items.length) return;
	index = Math.max(0, Math.min(index, items.length - 1));
	items.forEach((item, i) => {
		item.style.display = i === index ? 'flex' : 'none';
	});
	equalizeHeights();
	updateEditDeleteOptions();
}

document.addEventListener('click', (e) => {
	const btn = e.target.closest('.btn-previous, .btn-next');
	if (!btn) return;
	const items = Array.from(document.querySelectorAll('.content__item'));
	if (!items.length) return;
	let current = items.findIndex((item) => item.style.display !== 'none');
	if (current === -1) current = 0;
	const delta = btn.classList.contains('btn-next') ? 1 : -1;
	showQuestionAt(current + delta);
});

function buildBlock(row) {
	const item = document.createElement('div');
	item.className = 'content__item q-' + row.q_num;
	item.dataset.num = row.q_num;
	item.innerHTML =
		'<div class="content-question item">' +
			'<span class="q-num"></span>' +
			'<div class="question-text">' + escapeHtml(row.question).replace(/\n/g, '<br>') + '</div>' +
			'<div class="buttons">' +
				'<button class="btn-previous"><<<</button>' +
				'<button class="btn-next">>>></button>' +
			'</div>' +
		'</div>' +
		'<div class="content-answer item">' +
			'<span class="a-num"></span>' +
			'<div class="answer-text">' + escapeHtml(row.answer).replace(/\n/g, '<br>') + '</div>' +
			'<button class="btn-show-hide">Show / Hide</button>' +
		'</div>';
	hideAnswer(item.querySelector('.answer-text'));
	return item;
}

const content = document.querySelector('.content');
const btnNewQuestion = document.querySelector('.btn-new-question');
const btnNewCreate = document.querySelector('.btn-new-create');
const btnNewExit = document.querySelector('.btn-new-exit');
const formInput = document.querySelector('.form-input');
const btnsCreateExit = document.querySelector('.btns-create-exit');
const inputQ = document.querySelector('.input-q');
const inputA = document.querySelector('.input-a');
const newQNum = document.querySelector('.new-q-num');
const newANum = document.querySelector('.new-a-num');
const questionsList = [];
let editMode = null;

function updateEditDeleteOptions() {
	const select = document.querySelector('.number-to-edit-delete');
	if (!select) return;
	const nums = Array.from(document.querySelectorAll('.content__item'))
		.map((el) => parseInt(el.dataset.num, 10) || 0)
		.sort((a, b) => a - b);
	select.innerHTML = nums
		.map((n) => '<option value="' + n + '">' + n + '</option>')
		.join('');
}

function renderQuestions(list) {
	content.querySelectorAll('.content__item').forEach((el) => el.remove());
	const ref = content.querySelector('.main-buttons') || btnNewQuestion;
	list.forEach((row) => {
		content.insertBefore(buildBlock(row), ref);
	});
	updateNumbers();
	showQuestionAt(0);
}

async function loadQuestions() {
	try {
		const res = await fetch('/api/questions?page=' + page);
		if (!res.ok) return;
		const list = await res.json();
		questionsList.length = 0;
		Array.prototype.push.apply(questionsList, list);
		renderQuestions(list);
	} catch (err) {}
}

function setEditDeleteVisible(visible) {
	document.querySelectorAll('.btn-edit, .btn-delete').forEach((el) => {
		el.style.display = visible ? 'block' : 'none';
	});
}

function showForm() {
	const nums = Array.from(document.querySelectorAll('.content__item')).map(
		(el) => parseInt(el.dataset.num, 10) || 0
	);
	const nextNum = (nums.length ? Math.max(...nums) : 0) + 1;
	if (newQNum) newQNum.textContent = 'New question #' + nextNum;
	if (newANum) newANum.textContent = 'Answer to #' + nextNum;
	setEditDeleteVisible(false);
	formInput.style.display = 'flex';
	btnsCreateExit.style.display = 'block';
	void formInput.offsetWidth;
	formInput.classList.add('is-visible');
	btnsCreateExit.classList.add('is-visible');
}

function hideForm() {
	formInput.classList.remove('is-visible');
	btnsCreateExit.classList.remove('is-visible');
	formInput.style.display = 'none';
	btnsCreateExit.style.display = 'none';
	setEditDeleteVisible(true);
}

async function createQuestion() {
	const question = inputQ.value.trim();
	const answer = inputA.value.trim();
	if (!question || !answer) return;
	try {
		const res = await fetch('/api/questions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ page, question, answer })
		});
		if (!res.ok) return;
		await loadQuestions();
		inputQ.value = '';
		inputA.value = '';
		hideForm();
	} catch (err) {}
}

if (page && btnNewQuestion && formInput && btnsCreateExit) {
	btnNewQuestion.addEventListener('click', showForm);
}

if (page && btnNewCreate && inputQ && inputA) {
	btnNewCreate.addEventListener('click', createQuestion);
}

if (page && btnNewExit && formInput && btnsCreateExit) {
	btnNewExit.addEventListener('click', hideForm);
}

if (page) {
	const btnEdit = document.querySelector('.btn-edit');
	const btnDelete = document.querySelector('.btn-delete');
	const btnCancel = document.querySelector('.btn-cancel');
	const btnConfirm = document.querySelector('.btn-confirm');
	const mainButtons = document.querySelector('.main-buttons');
	const editDelete = document.querySelector('.edit-delete');
	const titleEdit = document.querySelector('.title-edit');
	const titleDelete = document.querySelector('.title-delete');
	const select = document.querySelector('.number-to-edit-delete');

	if (btnEdit && mainButtons && editDelete) {
		btnEdit.addEventListener('click', () => {
			editMode = 'edit';
			mainButtons.style.display = 'none';
			if (titleEdit) titleEdit.style.display = 'block';
			if (titleDelete) titleDelete.style.display = 'none';
			editDelete.style.display = 'block';
			updateEditDeleteOptions();
			showEditForm();
		});
	}

	function showEditForm() {
		const qNum = parseInt(select.value, 10);
		const row = questionsList.find((q) => q.q_num === qNum);
		if (row && inputQ && inputA) {
			inputQ.value = row.question;
			inputA.value = row.answer;
		}
		if (formInput) {
			formInput.style.display = 'flex';
			void formInput.offsetWidth;
			formInput.classList.add('is-visible');
		}
		if (btnsCreateExit) btnsCreateExit.style.display = 'none';
	}

	if (select) {
		select.addEventListener('change', () => {
			if (editMode === 'edit' && inputQ && inputA) {
				const qNum = parseInt(select.value, 10);
				const row = questionsList.find((q) => q.q_num === qNum);
				if (row) {
					inputQ.value = row.question;
					inputA.value = row.answer;
				}
			}
		});
	}

	function closeEditForm() {
		if (formInput) {
			formInput.classList.remove('is-visible');
			formInput.style.display = 'none';
		}
		if (inputQ) inputQ.value = '';
		if (inputA) inputA.value = '';
	}

	if (btnDelete && mainButtons && editDelete) {
		btnDelete.addEventListener('click', () => {
			editMode = null;
			mainButtons.style.display = 'none';
			if (titleEdit) titleEdit.style.display = 'none';
			if (titleDelete) titleDelete.style.display = 'block';
			editDelete.style.display = 'block';
			updateEditDeleteOptions();
			closeEditForm();
		});
	}

	if (btnCancel && editDelete && mainButtons) {
		btnCancel.addEventListener('click', () => {
			editMode = null;
			closeEditForm();
			editDelete.style.display = 'none';
			mainButtons.style.display = 'block';
		});
	}

	if (btnConfirm && select && editDelete && mainButtons) {
		btnConfirm.addEventListener('click', async () => {
			const qNum = parseInt(select.value, 10);
			if (!qNum) return;
			if (editMode === 'edit') {
				const question = inputQ.value.trim();
				const answer = inputA.value.trim();
				if (!question || !answer) return;
				try {
					const res = await fetch(
						'/api/questions?page=' + page + '&q_num=' + qNum,
						{
							method: 'PUT',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ question, answer })
						}
					);
					if (!res.ok) return;
					editMode = null;
					closeEditForm();
					editDelete.style.display = 'none';
					mainButtons.style.display = 'block';
					await loadQuestions();
				} catch (err) {}
				return;
			}
			try {
				const res = await fetch(
					'/api/questions?page=' + page + '&q_num=' + qNum,
					{ method: 'DELETE' }
				);
				if (!res.ok) return;
				await loadQuestions();
				editDelete.style.display = 'none';
				mainButtons.style.display = 'block';
			} catch (err) {}
		});
	}
}

window.addEventListener('resize', equalizeHeights);

if (page) {
	loadQuestions();
}
