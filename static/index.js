let mainCourseData = null;
let chosenCourses = {};
let tempChosenCourses = {};
let ogPath = 'default';
const semName = ['Monsoon', 'Spring'];
const doubleSemCourses = [
  'Calculus',
  'Introduction to Computer Science',
  'Computer Organisation and Systems',
  'Probability and Statistics',
  'Linear Algebra',
  'Advanced Microeconomics',
  'Advanced Macroeconomics',
  'Advanced Econometrics',
];
const majorCreds = {
  default: 'NA',
  './courses/cs_maj.json': 116,
  './courses/cs_major_math_crypt.json': 116,
  './courses/cs_major_math_ml.json': 116,
  './courses/cs_ent.json': 116,
  './courses/economics.json': 116,
  './courses/econ_fin.json': 116
};
// for majorCredits
let deftag = 0;

window.darkenedSems = [];

const showAlert = async (message, title = '') => {
  // Create the overlay div
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full';

  // Create the popup div
  const popup = document.createElement('div');
  popup.className = 'relative top-20 mx-auto p-4 border w-96 shadow-lg rounded-md bg-white flex flex-col';

  // Add the title
  if (title !== '') {
    const titleElement = document.createElement('p');
    titleElement.textContent = title;
    titleElement.className = 'mb-2 font-bold text-xl font-mono';

    popup.appendChild(titleElement);
  }

  // Add the message
  const messageElement = document.createElement('p');
  const messageText = message.replace(/\n/g, '<br>'); // Replace \n with <br> tags
  messageElement.innerHTML = messageText; // Use innerHTML to render <br> tags
  messageElement.className = 'mb-4 text-sm font-mono whitespace-pre-line'; // Apply whitespace-pre-line to handle line breaks

  // Add a close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.className = 'px-4 py-2 bg-red-500 mx-auto text-white hover:bg-red-700 rounded font-mono text-sm inline-flex items-center w-fit';
  closeButton.onclick = function () {
    document.body.removeChild(overlay);
  };

  // Append elements to the popup
  popup.appendChild(messageElement);
  popup.appendChild(closeButton);

  // Append the popup to the overlay
  overlay.appendChild(popup);

  // Append the overlay to the body
  document.body.appendChild(overlay);
};

function updatePrerequisitesDisplay(movedCourse) {
  console.log(movedCourse);

  // Iterate through all courses in the target semester
  for (let sem = 1; sem <= 8; sem++) {
    const coursesToCheck = chosenCourses[sem];
    let darken = false;

    coursesToCheck.forEach((courseName) => {
      const course = mainCourseData.find((c) => c.name === courseName);

      if (course && course.pre_reqs) {
        course.pre_reqs.forEach((prerequisiteCourseName) => {
          const prereqCourseElem = document.getElementById(prerequisiteCourseName);
          if (prereqCourseElem && chosenCourses[sem].includes(prerequisiteCourseName)) {
            if (courseName === movedCourse || prerequisiteCourseName === movedCourse) {
              // Prerequisite course not completed yet, check for waiver
              showAlert((message=`course: ${courseName} requires that you have completed ${prerequisiteCourseName}. \nPlease obtain a waiver from OAA.`),(title='Waiver Required'));
            }
            // Darken the background of the prerequisite course
            darken = true;
          }
        });
      }
    });

    const semElem = document.getElementById(`sem${sem}`);
    if (darken) {
      semElem.classList.add('brightness-90');
    } else if (semElem.classList.contains('brightness-90')) {
      semElem.classList.remove('brightness-90');
    }
  }
}

const getCourseData = async (query, path, exec) => {
  if (path === ogPath && mainCourseData && !exec) {
    ogPath = path;
    return mainCourseData;
  } else {
    // empty query on same path || clear || select diff major
    if ((!query && path === ogPath) || exec || path !== ogPath) {
      for (let sem = 1; sem <= 8; sem++) {
        chosenCourses[sem] = [];
        const innerDiv1 = document.querySelector(`#Semester-${sem}`);
        const innerDiv2 = document.querySelector(`#sem${sem}`);
        if (innerDiv1) {
          innerDiv1.textContent = `Semester ${sem}\n Credits: ${0}\r\n(${semName[(sem - 1) % 2]})`;
        }
        innerDiv2.setAttribute('credits', '0');
        if (innerDiv2) {
          while (innerDiv2.firstChild) {
            innerDiv2.removeChild(innerDiv2.firstChild);
          }
        }
      }
    }
    if (path === 'default') {
      mainCourseData = await fetch('./courses/courses.json').then((res) => res.json());
      document.querySelector('#majorCredits').innerHTML = '';
      deftag = 0;
      totCredits = document.querySelector('#totalCredits');
      totCredits.setAttribute('credits', '0');
      totCredits.innerHTML = `Total Credits: ${totCredits.getAttribute('credits')}`;
      semContainer = document.querySelector('#semContainer');
      semContainer.classList.remove('h-[93vh]');
      semContainer.classList.add('h-[95vh]');
    } else {
      mainCourseData = await fetch(path).then((res) => res.json());
      if (path !== ogPath) {
        deftag = 1;
        majorDiv = document.querySelector('#majorCredits');
        majorDiv.setAttribute('credits', majorCreds[path]);
        majorDiv.innerHTML = `Remaining Non-Open Academic Credits: ${majorDiv.getAttribute('credits')}`;
        totCredits = document.querySelector('#totalCredits');
        totCredits.setAttribute('credits', '0');
        totCredits.innerHTML = `Total Credits: ${totCredits.getAttribute('credits')}`;
        semContainer = document.querySelector('#semContainer');
        semContainer.classList.remove('h-[95vh]');
        semContainer.classList.add('h-[93vh]');
      }
    }
    ogPath = path;
    return mainCourseData;
  }
};

const getCourses = async ({ query, major, exec }) => {
  const courses = [];
  const coursesData = await getCourseData(query, major, exec);
  const keys = ['name', 'code'];

  for (const course of coursesData) {
    var v = 0;
    for (var i = 0; i < 2; i++) {
      if (typeof course[keys[i]] === 'string' && v == 0) {
        if (course[keys[i]].toLowerCase().includes(query.toLowerCase())) {
          courses.push(course);
          v = v + 1;
        }
      } else if (v == 0) {
        if (course[keys[i]].some((value) => value.toLowerCase().includes(query.toLowerCase()))) {
          courses.push(course);
        }
      }
    }
  }

  return courses;
};

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  const target = ev.target;
  // console.log('id: ' + target.id);
  const parent = target.parentNode;
  const sem = parent.id.replace('sem', '');

  ev.dataTransfer.setData('elementData', JSON.stringify({ courseName: target.id, ogSem: sem }));
}

function check_prereqs(coursename, sem) {
  const course = mainCourseData.find((course) => course.name === coursename);
  var pre_reqs = course.pre_reqs;
  var flag = pre_reqs.length;
  for (let i = 1; i <= sem; i++) {
    pre_reqs = pre_reqs.filter((coursename) => !tempChosenCourses[i].includes(coursename));
    flag = pre_reqs.length;
    // if flag=0 then all pre-reqs are satisfied
  }
  return [flag, pre_reqs];
}

function drop(ev) {
  ev.preventDefault();

  console.log(chosenCourses);

  const { courseName, ogSem } = JSON.parse(ev.dataTransfer.getData('elementData'));
  const elem = document.getElementById(courseName);

  let target = ev.target;
  while (target.getAttribute('droppable') !== 'true') {
    target = target.parentNode;
    if (!target) {
      ev.preventDefault();
      return;
    }
  }
  // Retrieve course name using courseId
  const course = mainCourseData.find((course) => course.name === courseName);
  let changed = true;

  const major = document.querySelector("#major").value;

  var pre_reqs = course.pre_reqs;
  var flag = pre_reqs.length;

  totalCreds = document.querySelector('#totalCredits');
  reqMajorCreds = document.querySelector('#majorCredits');

  const sem = target.id.replace('sem', '');
  const sem1Check = parseInt(sem) !== 1 || (parseInt(sem) === 1 && (course.name === 'Calculus' || course.name.slice(-4) === '(FC)'));
  if (sem1Check) {
    if (sem !== 'courseContainer') {
      for (let i = 1; i <= sem; i++) {
        pre_reqs = pre_reqs.filter((coursename) => !chosenCourses[i].includes(coursename));
        flag = pre_reqs.length;
        // if flag=0 then all pre-reqs are satisfied
      }
      check = true && (!course.sem_no || doubleSemCourses.includes(courseName) || sem % 2 == parseInt(course.sem_no) % 2);
    } else {
      flag = 0;
      check = true;
    }
    // const check = sem ==='courseContainer' || (sem!='courseContainer' && (!course.sem_no || doubleSemCourses.includes(courseName) || (sem%2 == parseInt(course.sem_no)%2)));
    if (
      check &&
      (!course.sem_no &&
      sem !== 'courseContainer' &&
      course.name.slice(-4) !== '(FC)' &&
      course.name.slice(0, 8) !== 'Elective' &&
      course.name.slice(0, 16) !== 'Entrepreneurship' &&
      !doubleSemCourses.includes(courseName)
        ? semName[(sem - 1) % 2] === course.semester
        : true)
    ) {
      var credit_check = true;
      const semCreds = [16, 22, 22, 22, 22, 22, 22, 22];
      if (sem !== 'courseContainer') {
        credit_check = parseInt(target.getAttribute('credits')) + parseInt(course.credits) <= semCreds[sem - 1];
      }
      // insert to courseContainer or all pre-requisites satisfied
      if (!flag && credit_check) {
        var flagend = 0;
        if (ogSem !== 'courseContainer') {
          tempChosenCourses = JSON.parse(JSON.stringify(chosenCourses));
          // Temporarily remove the dropped course
          tempChosenCourses[ogSem] = tempChosenCourses[ogSem].filter((course) => course !== courseName);
          if (sem !== 'courseContainer') {
            tempChosenCourses[sem].push(courseName);
          }
          for (let i = 1; i <= 8; i++) {
            tempChosenCourses[i].forEach((coursename) => {
              // Use tempChosenCourses inside check_prereqs
              const [flagcourse, pre_reqs1] = check_prereqs(coursename, i);
              if (flagcourse && mainCourseData.find((course) => course.name === coursename).pre_reqs.length !== 0) {
                flagend = 1;
                changed = false;
                showAlert((message='course: ' + coursename + '\n' + 'pre-requisites: ' + pre_reqs1 + ' not satisfied'),(title='Incomplete Pre-requisites'));
              }
            });
          }
        }
        if (!flagend) {
          // target sem div
          if (sem !== 'courseContainer') {
            if (!chosenCourses[sem].includes(courseName)) {
              chosenCourses[sem].push(courseName);
              if (ogSem == 'courseContainer' && sem !== 'courseContainer') {
                totalCredVal = parseInt(totalCreds.getAttribute('credits'));
                totalCreds.setAttribute('credits', totalCredVal + course.credits);
                totalCreds.innerHTML = `Total Credits: ${totalCreds.getAttribute('credits')}`;
                if (deftag && (majorCreds[major] - parseInt(totalCreds.getAttribute('credits'))) >= 0) {
                  reqMajorCreds.setAttribute('credits', majorCreds[major] - parseInt(totalCreds.getAttribute('credits')));
                  reqMajorCreds.innerHTML = `Remaining Non-Open Academic Credits: ${reqMajorCreds.getAttribute('credits')}`;
                }
                if (majorCreds[major] - parseInt(totalCreds.getAttribute('credits')) < 0) {
                  reqMajorCreds.setAttribute('credits', 0);
                  reqMajorCreds.innerHTML = `Remaining Non-Open Academic Credits: ${reqMajorCreds.getAttribute('credits')}`;
                }
              }
            }
          }
          if (ogSem !== 'courseContainer') {
            // remove the course from the original container in chosenCourses
            const index = chosenCourses[ogSem].indexOf(courseName);
            if (index > -1) {
              const prevSemdiv = target.parentNode.parentNode.querySelector(`#Semester-${ogSem}`);
              const prevSemtarget = target.parentNode.parentNode.querySelector(`#sem${ogSem}`);
              prevSemtarget.setAttribute('credits', parseInt(prevSemtarget.getAttribute('credits')) - course.credits);
              if (prevSemdiv) {
                prevSemdiv.textContent = `Semester ${ogSem}\n Credits: ${prevSemtarget.getAttribute('credits')}\r\n(${semName[(ogSem - 1) % 2]})`;
              }
              if (ogSem != sem) {
                chosenCourses[ogSem].splice(index, 1);
                if (sem == 'courseContainer' && ogSem !== 'courseContainer') {
                  totalCredVal = parseInt(totalCreds.getAttribute('credits'));
                  totalCreds.setAttribute('credits', totalCredVal - course.credits);
                  totalCreds.innerHTML = `Total Credits: ${totalCreds.getAttribute('credits')}`;
                  if (deftag && (majorCreds[major] - parseInt(totalCreds.getAttribute('credits'))) >= 0) {
                    reqMajorCreds.setAttribute('credits', majorCreds[major] - parseInt(totalCreds.getAttribute('credits')));
                    reqMajorCreds.innerHTML = `Remaining Non-Open Academic Credits: ${reqMajorCreds.getAttribute('credits')}`;
                  }
                  if (majorCreds[major] - parseInt(totalCreds.getAttribute('credits')) < 0) {
                    reqMajorCreds.setAttribute('credits', 0);
                    reqMajorCreds.innerHTML = `Remaining Non-Open Academic Credits: ${reqMajorCreds.getAttribute('credits')}`;
                  }
                }
              }
            }
          }
          // console.log(chosenCourses);

          //target.appendChild(elem);
          target.insertBefore(elem, target.firstChild);
          const attributeValue = target.getAttribute('credits');
          const innerDiv1 = target.parentNode.querySelector(`#Semester-${sem}`);
          if (innerDiv1) {
            innerDiv1.textContent = `Semester ${sem}\n Credits: ${parseInt(attributeValue) + parseInt(course.credits)}\r\n(${
              semName[(sem - 1) % 2]
            })`;
          }
          target.setAttribute('credits', parseInt(attributeValue) + parseInt(course.credits));
        }
      } else {
        if (parseInt(target.getAttribute('credits')) + parseInt(course.credits) > semCreds[sem - 1]) {
          changed = false;
          showAlert('Exceeding course cap: ' + semCreds[sem - 1]);
        } else {
          changed = false;
          showAlert((message='course: ' + courseName + '\n' + 'pre-requisites: ' + pre_reqs + ' not satisfied'),(title='Incomplete Pre-requisites'));
        }
      }
    } else {
      changed = false;
      showAlert('course: ' + courseName + ' is not offered in ' + semName[(sem - 1) % 2]);
    }
  } else {
    changed = false;
    showAlert(`Only Calculus and FC's are allowed in Semester 1`);
  }

  if (changed) {
    updatePrerequisitesDisplay(courseName);
  }
}

async function updateCourses(exec = 0) {
  const major = document.querySelector('#major').value;
  query = document.querySelector('#courseQuery').value;
  const courses = await getCourses({ query, major, exec });

  const container = document.querySelector('#courseContainer');
  let selectedCourses = [];
  container.innerHTML = '';
  Object.values(chosenCourses).forEach((semCourses) => {
    if (semCourses.length != 0) {
      selectedCourses = selectedCourses.concat(semCourses);
    }
  });
  courses.forEach((course) => {
    if (!selectedCourses.includes(course.name)) {
      const div = document.createElement('div');
      div.classList.add('m-1', 'p-2', 'bg-white', 'shadow', 'border-3', 'border-[#003049]', 'rounded-md', 'border-blue-900');
      div.setAttribute('name', 'courseDiv');
      div.setAttribute('draggable', 'true');

      div.ondragstart = (event) => drag(event);
      // set div id as course name
      div.setAttribute('id', course.name);
      // div.setAttribute('id', course.code);

      const topDiv = document.createElement('div');
      topDiv.classList.add('flex', 'flex-row', 'justify-between', 'items-center', 'mb-1');

      const courseName = document.createElement('p');
      courseName.classList.add('text-left', 'py-1', 'font-bold', 'font-mono', 'w-[57.5%]');
      courseName.style.clear = 'both';
      courseName.textContent = course.name;

      if (course.name.slice(0, 8) === 'Elective' || course.name.slice(0, 16) === 'Entrepreneurship') {
        courseName.contentEditable = true;
        courseName.addEventListener('click', () => {
          courseName.focus();
        });
      }

      const courseCredits = document.createElement('p');
      courseCredits.classList.add('text-center', 'py-1', 'font-mono', 'text-sm', 'w-[37.5%]');
      courseCredits.textContent = `${course.credits} Credits`;

      topDiv.appendChild(courseName);
      topDiv.appendChild(courseCredits);

      const courseCode = document.createElement('p');
      courseCode.classList.add('text-center', 'm-0', 'mb-2', 'font-mono', 'text-sm');
      courseCode.textContent = course.code;

      const courseSemesters = document.createElement('p');
      courseSemesters.classList.add('text-left', 'm-0', 'mb-2', 'font-mono', 'text-sm');
      courseSemesters.innerHTML = `Offered In: <b>${
        doubleSemCourses.includes(course.name) ? semName : course.sem_no === 0 ? course.semester : semName[(course.sem_no - 1) % 2]
      }</b>`;

      const coursePrereqs = document.createElement('div');
      coursePrereqs.classList.add('text-left', 'm-0', 'font-mono', 'text-sm', 'relative');

      const collapsibleHeader = document.createElement('button');
      collapsibleHeader.classList.add('rounded-md', 'p-2', 'text-xs', 'bg-cyan-500', 'shadow-sm', 'focus:outline-none');
      collapsibleHeader.textContent = 'View Prerequisites';

      const collapsibleContent = document.createElement('div');
      collapsibleContent.classList.add(
        'hidden',
        'border',
        'border-gray-300',
        'shadow-lg',
        'p-2',
        'z-10',
        'max-h-32',
        'overflow-y-auto',
        'text-xs',
        'mt-1'
      );
      if (course.pre_reqs.length != 0) {
        collapsibleContent.textContent = course.pre_reqs;
      } else {
        collapsibleContent.textContent = 'None';
      }

      collapsibleHeader.addEventListener('click', () => {
        collapsibleContent.classList.toggle('hidden');
        if (!collapsibleContent.classList.contains('hidden')) {
          collapsibleContent.style.maxHeight = collapsibleContent.scrollHeight + 'px';
        } else {
          collapsibleContent.style.maxHeight = null;
        }
      });

      coursePrereqs.appendChild(collapsibleHeader);
      coursePrereqs.appendChild(collapsibleContent);

      // append
      div.appendChild(topDiv);
      // div.appendChild(courseName);
      // div.appendChild(courseCode);
      // div.appendChild(courseCredits);
      div.appendChild(courseSemesters);
      div.appendChild(coursePrereqs);
      container.appendChild(div);
    }
  });
}

window.onload = () => {
  const semContainer = document.querySelector('#semContainer');
  const noSems = 8;
  const noRows = 2;
  const noCols = noSems / noRows;

  semContainer.classList.add(`grid-cols-${noCols}`, `grid-rows-${noRows}`);

  const sems = Array.from({ length: noSems }, (_, i) => i + 1);

  for (const sem of sems) {
    chosenCourses[sem] = [];
    const div = document.createElement('div');
    //
    div.classList.add('p-0', 'pb-5', 'm-0', 'border-[3px]', 'border-black', 'w-full', 'h-full', 'shadow', 'bg-slate-100', 'overflow-hidden');

    const innerDiv1 = document.createElement('div');
    // bg-[#c1121f]
    innerDiv1.classList.add(
      'text-center',
      'text-white',
      'font-mono',
      'bg-[#ad0f19]',
      'py-2',
      'mt-0',
      'mb-0',
      'text-base',
      'border-b-[3px]',
      'border-black'
    );
    innerDiv1.setAttribute('id', `Semester-${sem}`);
    // Add attribute to innerDiv2 and display its value in innerDiv1
    const innerDiv2 = document.createElement('div');
    innerDiv2.classList.add('mx-auto', 'pl-3', 'pr-1', 'pt-2', 'pb-4', 'w-full', 'h-full', 'overflow-y-scroll');
    innerDiv2.ondrop = (event) => drop(event);
    innerDiv2.ondragover = (event) => allowDrop(event);
    innerDiv2.setAttribute('id', `sem${sem}`);
    innerDiv2.setAttribute('credits', '0');
    innerDiv1.textContent = `Semester ${sem} Credits: ${innerDiv2.getAttribute('credits')} \r\n(${semName[(sem - 1) % 2]})`; // Display attribute value in innerDiv1

    innerDiv2.setAttribute('droppable', 'true');
    div.appendChild(innerDiv1);
    div.appendChild(innerDiv2);

    semContainer.appendChild(div);
  }
  updateCourses();
  credDiv = document.querySelector('#totalCredits');
  credDiv.setAttribute('credits', '0');
  totCredits = credDiv.getAttribute('credits');
  credDiv.innerHTML = `Total Credits: ${totCredits}`;
  majorDiv = document.querySelector('#majorCredits');
  majorDiv.setAttribute('credits', '0');
  majorDiv.innerHTML = ``;

  showAlert(
    (message =
      'This platform is designed to aid in course planning and major selection at Ashoka University. \nDue to potential curriculum changes, verify all information independently. Use this tool as a guide, not the sole basis for academic decisions.'),
    (title = 'Disclaimer')
  );
};

function rec_courses(recom = 0) {
  const major = document.getElementById('major').value;

  query = document.querySelector('#courseQuery');
  totalCreds = document.querySelector('#totalCredits');
  reqMajorCreds = document.querySelector('#majorCredits');
  reqMajorCreds.setAttribute('credits', majorCreds[major]);
  console.log(reqMajorCreds.getAttribute('credits'));
  var totalcredits = 0;
  if (major !== 'default' && recom) {
    if (query) {
      document.querySelector('#courseQuery').value = '';
      updateCourses(1).then(() => {
        const courseContainer = document.querySelector('#courseContainer');
        // add courses to semesters
        for (let i = courseContainer.children.length - 1; i >= 0; i--) {
          const courseDiv = courseContainer.children[i];
          const course = mainCourseData.find((course) => course.name === courseDiv.getAttribute('id'));
          const semester = parseInt(course.sem_no);
          if (semester) {
            const semesterDiv = document.querySelector(`#sem${course.sem_no}`);
            const semesertDivCredit = document.querySelector(`#Semester-${course.sem_no}`);
            chosenCourses[parseInt(course.sem_no)].push(course.name);
            semesterDiv.insertBefore(courseDiv, semesterDiv.firstChild);
            totalcredits = totalcredits + course.credits;
            if (semesertDivCredit) {
              semesertDivCredit.textContent = `Semester ${course.sem_no}\n Credits: ${
                parseInt(semesterDiv.getAttribute('credits')) + parseInt(course.credits)
              }\r\n(${semName[(semester - 1) % 2]})`;
            }
            semesterDiv.setAttribute('credits', parseInt(semesterDiv.getAttribute('credits')) + parseInt(course.credits));
            if (courseDiv.parentNode === courseContainer) {
              courseContainer.removeChild(courseDiv);
            }
          }
        }
        totalCreds.setAttribute('credits', totalcredits);
        totalCreds.innerHTML = `Total Credits: ${totalcredits}`;
        reqMajorCreds.setAttribute('credits', parseInt(reqMajorCreds.getAttribute('credits')) - totalcredits);
        reqMajorCreds.innerHTML = `Remaining Non-Open Academic Credits: ${reqMajorCreds.getAttribute('credits')}`;
      });
    } else {
      updateCourses(1).then(() => {
        const courseContainer = document.querySelector('#courseContainer');
        // add courses to semesters
        for (let i = courseContainer.children.length - 1; i >= 0; i--) {
          const courseDiv = courseContainer.children[i];
          const course = mainCourseData.find((course) => course.name === courseDiv.getAttribute('id'));
          const semester = parseInt(course.sem_no);
          if (semester) {
            const semesterDiv = document.querySelector(`#sem${course.sem_no}`);
            const semesertDivCredit = document.querySelector(`#Semester-${course.sem_no}`);
            chosenCourses[parseInt(course.sem_no)].push(course.name);
            totalcredits = totalcredits + course.credits;
            semesterDiv.insertBefore(courseDiv, semesterDiv.firstChild);
            if (semesertDivCredit) {
              semesertDivCredit.textContent = `Semester ${semester}\n Credits: ${
                parseInt(semesterDiv.getAttribute('credits')) + parseInt(course.credits)
              }\r\n(${semName[(semester - 1) % 2]})`;
            }
            semesterDiv.setAttribute('credits', parseInt(semesterDiv.getAttribute('credits')) + parseInt(course.credits));
            if (courseDiv.parentNode === courseContainer) {
              courseContainer.removeChild(courseDiv);
            }
          }
        }
        totalCreds.setAttribute('credits', totalcredits);
        totalCreds.innerHTML = `Total Credits: ${totalcredits}`;
        if (reqMajorCreds.getAttribute('credits') > 0) {
          reqMajorCreds.setAttribute('credits', parseInt(reqMajorCreds.getAttribute('credits')) - totalcredits);
          reqMajorCreds.innerHTML = `Remaining Non-Open Academic Credits: ${reqMajorCreds.getAttribute('credits')}`;
        }
        if (reqMajorCreds.getAttribute('credits') > 0) {
          reqMajorCreds.setAttribute('credits', 0);
        }
      });
    }
  } else {
    // clear
    if (major === 'default' && recom) {
      showAlert('Cannot recommend courses here.\nPlease select a major and try again');
    } else {
      if (!recom) {
        updateCourses(1);
        totalCreds.setAttribute('credits', '0');
        totalCreds.innerHTML = `Total Credits: ${credDiv.getAttribute('credits')}`;
        if (deftag) {
          reqMajorCreds.setAttribute('credits', majorCreds[major]);
          reqMajorCreds.innerHTML = `Remaining Non-Open Academic Credits: ${reqMajorCreds.getAttribute('credits')}`;
        }
      }
    }
  }
}

function downloadCSV() {
  let csvContent = '';
  const semesterKeys = Object.keys(chosenCourses);

  csvContent += semesterKeys.map((key) => `Semester ${key}`).join(',') + '\n';

  const maxCourses = Math.max(...semesterKeys.map((key) => chosenCourses[key].length));

  for (let i = 0; i < maxCourses; i++) {
    semesterKeys.forEach((key, index) => {
      csvContent += i < chosenCourses[key].length ? `${chosenCourses[key][i]}` : '';
      csvContent += index !== semesterKeys.length - 1 ? ',' : '\n';
    });
  }

  const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const csvUrl = URL.createObjectURL(csvBlob);

  const csvLink = document.createElement('a');
  csvLink.href = csvUrl;
  csvLink.setAttribute('download', 'courses.csv');
  document.body.appendChild(csvLink);
  csvLink.click();

  let xlsxContent = 'sep=,\r\n';
  const rows = csvContent.split('\n').map((row) => row.split(','));
  rows.forEach((row) => {
    xlsxContent += row.map((cell) => `"${cell}"`).join(',') + '\r\n';
  });

  const xlsxBlob = new Blob([xlsxContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const xlsxUrl = URL.createObjectURL(xlsxBlob);

  const xlsxLink = document.createElement('a');
  xlsxLink.href = xlsxUrl;
  xlsxLink.setAttribute('download', 'courses.xlsx');
  document.body.appendChild(xlsxLink);
  xlsxLink.click();
}