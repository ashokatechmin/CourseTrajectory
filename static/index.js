let mainCourseData = null;
let chosenCourses = {};

const getCourseData = async () => {
  if (mainCourseData) {
    return mainCourseData;
  }
  mainCourseData = await fetch('./courses.json').then((res) => res.json());
  return mainCourseData;
};

const getCourses = async ({ query }) => {
  const courses = [];
  const coursesData = await getCourseData();
  const keys = ['code', 'name', 'subject'];

  for (const course of coursesData) {
    // use the any operatore for checking if the query is in any of the keys
    if (keys.some((key) => course[key].toLowerCase().includes(query))) {
      courses.push(course);
    }
  }

  return courses;
};

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  const target = ev.target;
  const parent = target.parentNode;
  const sem = parent.id.replace('sem', '');

  ev.dataTransfer.setData('elementData', JSON.stringify({ courseId: target.id, ogSem: sem }));
}

function drop(ev) {
  ev.preventDefault();

  const { courseId, ogSem } = JSON.parse(ev.dataTransfer.getData('elementData'));
  const elem = document.getElementById(courseId);

  let target = ev.target;
  while (target.getAttribute('droppable') !== 'true') {
    target = target.parentNode;
    if (!target) {
      ev.preventDefault();
      return;
    }
  }

  const sem = target.id.replace('sem', '');
  if (sem !== 'courseContainer') {
    chosenCourses[sem].push(courseId);
  }

  if (ogSem !== 'courseContainer') {
    // remove the course from the original container in chosenCourses
    const index = chosenCourses[ogSem].indexOf(courseId);
    if (index > -1) {
      chosenCourses[ogSem].splice(index, 1);
    }
  }
  console.log(chosenCourses);

  target.appendChild(elem);
}

async function updateCourses() {
  const query = document.querySelector('#courseQuery').value;
  const courses = await getCourses({ query });

  const container = document.querySelector('#courseContainer');
  container.innerHTML = '';

  let selectedCourses = document.getElementsByName('courseDiv');
  selectedCourses = Array.from(selectedCourses).map((course) => course.id);

  courses.forEach((course) => {
    if (selectedCourses.includes(course.code)) {
      return;
    }

    const div = document.createElement('div');
    div.classList.add('col');
    div.setAttribute('name', 'courseDiv');
    div.setAttribute('draggable', 'true');
    div.ondragstart = (event) => drag(event);
    div.setAttribute('id', course.code);

    const div2 = document.createElement('div');
    div2.classList.add('courseInfo');

    const courseName = document.createElement('h5');
    courseName.classList.add('text-center', 'm-0');
    courseName.textContent = course.name;

    const courseCode = document.createElement('p');
    courseCode.classList.add('text-center', 'm-0', 'p-0');
    courseCode.textContent = course.code;

    // append
    div2.appendChild(courseName);
    div2.appendChild(courseCode);
    div.appendChild(div2);
    container.appendChild(div);
  });
}

window.onload = () => {
  const semContainer = document.querySelector('#semContainer');
  const noSems = 8;

  for (let sem = 1; sem <= noSems; sem++) {
    chosenCourses[sem] = [];

    const div = document.createElement('div');
    div.classList.add('d-flex', 'p-0', 'm-0', 'border', 'border-black');

    const innerDiv1 = document.createElement('div');
    innerDiv1.classList.add('text-center', 'bg-secondary', 'py-2', 'mt-0', 'w-25');
    innerDiv1.textContent = `Semester ${sem}`;
    div.appendChild(innerDiv1);

    const innerDiv2 = document.createElement('div');
    innerDiv2.classList.add('mx-auto', 'px-4', 'py-2', 'w-100', 'row', 'row-cols-5', 'align-items-center');
    innerDiv2.ondrop = (event) => drop(event);
    innerDiv2.ondragover = (event) => allowDrop(event);
    innerDiv2.setAttribute('id', `sem${sem}`);

    innerDiv2.setAttribute('droppable', 'true');
    div.appendChild(innerDiv2);

    semContainer.appendChild(div);
  }

  updateCourses();
};
