let mainCourseData = null;
let chosenCourses = {};

const getCourseData = async () => {
  if (mainCourseData) {
    return mainCourseData;
  }
  mainCourseData = await fetch('./courses/cs_maj.json').then((res) => res.json());
  return mainCourseData;
};

const getCourses = async ({ query }) => {
  const courses = [];
  const coursesData = await getCourseData();
  const keys = ['name', 'code'];

  for (const course of coursesData) {
   // use the any operatore for checking if the query is in any of the keys
    // if (keys.some((key) => course[key].toLowerCase().includes(query))) {
    for (var i = 0; i < 2; i++) {
      if (typeof(course[keys[i]])==='string') {
          if (course[keys[i]].toLowerCase().includes(query.toLowerCase())) {
            courses.push(course);
          }
      }
      // array type
      else{
        if (course[keys[i]].some((value) => value.toLowerCase().includes(query.toLowerCase()))) {
          courses.push(course);
        }
      }
    }
    // if (keys.some((key) => course[key].toLowerCase().includes(query))) {
    //   courses.push(course);
    //   }
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
    console.log(course.name)
    if (selectedCourses.includes(course.code)) {
      return;
    }

    const div = document.createElement('div');
    div.classList.add('m-1', 'p-[3px]', 'bg-slate-100', 'shadow');
    div.setAttribute('name', 'courseDiv');
    div.setAttribute('draggable', 'true');
    div.ondragstart = (event) => drag(event);
    div.setAttribute('id', course.code);

    const courseName = document.createElement('p');
    courseName.classList.add('text-center', 'm-0', 'font-medium','font-mono','text-sm');
    courseName.textContent = course.name;

    const courseCode = document.createElement('p');
    courseCode.classList.add('text-center', 'm-0','font-mono','text-sm');
    courseCode.textContent = course.code;

    // append
    div.appendChild(courseName);
    div.appendChild(courseCode);
    container.appendChild(div);
  });
}

window.onload = () => {
  const semContainer = document.querySelector('#semContainer');
  const noSems = 8;
  const noRows = 2;
  const noCols = noSems / noRows;

  semContainer.classList.add(`grid-cols-${noCols}`, `grid-rows-${noRows}`);

  // create the semesters in a way so that 1, ..., n is converted into an array like: [1, 3, 5, 7, 2, 4, 6, 8]
  // this is done so that the semesters are displayed in a zig-zag manner
  const sems = Array.from({ length: noSems }, (_, i) => i + 1);
  const semsZigZag = [];
  for (let i = 0; i < noRows; i++) {
    semsZigZag.push(...sems.filter((sem) => (sem - 1) % noRows === i));
  }
  console.log(semsZigZag);

  for (const sem of semsZigZag) {
    chosenCourses[sem] = [];

    const div = document.createElement('div');
    div.classList.add('p-0', 'm-0', 'border-[2px]', 'border-black', 'w-full', 'h-full');

    const innerDiv1 = document.createElement('div');
    innerDiv1.classList.add('text-center', 'text-white', 'drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.9)]', 'font-mono', 'bg-[#c1121f]', 'py-3', 'mt-0', 'mb-0', 'text-base', 'border-black');
    innerDiv1.textContent = `Semester ${sem}`;
    div.appendChild(innerDiv1);

    const innerDiv2 = document.createElement('div');
    innerDiv2.classList.add('mx-auto', 'px-4', 'py-2', 'w-full', 'h-full');
    innerDiv2.ondrop = (event) => drop(event);
    innerDiv2.ondragover = (event) => allowDrop(event);
    innerDiv2.setAttribute('id', `sem${sem}`);

    innerDiv2.setAttribute('droppable', 'true');
    div.appendChild(innerDiv2);

    semContainer.appendChild(div);
  }

  updateCourses();
};
