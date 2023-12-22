let mainCourseData = null;
let chosenCourses = {};
let tempChosenCourses = {};
let ogPath = 'default';

const getCourseData = async (path,exec) => {
  if (path===ogPath && mainCourseData && !exec) {
    ogPath = path;
    return mainCourseData;
  }else{
    for (let sem = 1; sem <= 8; sem++) {
      chosenCourses[sem] = [];
      const innerDiv1 = document.querySelector(`#Semester-${sem}`);
      const innerDiv2 = document.querySelector(`#sem${sem}`);
      if (innerDiv1){
        innerDiv1.textContent = `Semester ${sem}\n Credits: ${0}`;
      }
      innerDiv2.setAttribute('credits','0');
      if (innerDiv2) {
        while (innerDiv2.firstChild) {
          console.log('child:');
          console.log(innerDiv2.firstChild);
          innerDiv2.removeChild(innerDiv2.firstChild);
        }
      }
      console.log(innerDiv2);
    }

    if (path==='default') {
      mainCourseData = await fetch('./courses/courses.json').then((res) => res.json());
    }
    else{
      mainCourseData = await fetch(path).then((res) => res.json());
    }
    return mainCourseData;
  }
};

const getCourses = async ({ query,major,exec }) => {
  console.log(major);
  const courses = [];
  const coursesData = await getCourseData(major,exec);
  const keys = ['name', 'code'];

  for (const course of coursesData) {
    var v = 0;
    for (var i = 0; i < 2; i++) {
      if (typeof(course[keys[i]])==='string' && v==0) {
        if (course[keys[i]].toLowerCase().includes(query.toLowerCase())) {
          courses.push(course);
          v = v+1;
        }
      } else if(v==0){
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
  console.log('id: '+target.id);
  const parent = target.parentNode;
  const sem = parent.id.replace('sem', '');
  
  ev.dataTransfer.setData('elementData', JSON.stringify({ courseName: target.id, ogSem: sem }));
}

function check_prereqs(coursename,sem){
  const course = mainCourseData.find((course) => course.name === coursename);
  var pre_reqs = course.pre_reqs;
  var flag = pre_reqs.length;
  for (let i = 1; i <=sem; i++) {
    pre_reqs = pre_reqs.filter(coursename => !tempChosenCourses[i].includes(coursename))
    flag = pre_reqs.length;
    // if flag=0 then all pre-reqs are satisfied
  }
  return [flag,pre_reqs];
}

function drop(ev) {
  ev.preventDefault();

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

  var pre_reqs = course.pre_reqs;
  var flag = pre_reqs.length;
  
  const sem = target.id.replace('sem', '');
  if (sem!=='courseContainer') {
    for (let i = 1; i <=sem; i++) {
      pre_reqs = pre_reqs.filter(coursename => !chosenCourses[i].includes(coursename))
      flag = pre_reqs.length;
      // if flag=0 then all pre-reqs are satisfied
    }
  }else{
    flag = 0;
  }
  
  console.log('target: '+target.id);
  console.log((parseInt(target.getAttribute('credits'))+parseInt(course.credits)));
  var credit_check = true;
  if (sem !== 'courseContainer') {
    credit_check = (parseInt(target.getAttribute('credits'))+parseInt(course.credits))<=22;
  }
  // insert to courseContainer or all pre-requisites satisfied
  if (!flag && credit_check) {
    var flagend = 0;
    if (ogSem !== 'courseContainer') {
      tempChosenCourses = {... chosenCourses};
      // Temporarily remove the dropped course
      tempChosenCourses[ogSem] = tempChosenCourses[ogSem].filter(course => course !== courseName); 
      if (sem!=='courseContainer') {
        tempChosenCourses[sem].push(courseName);
      }
      for (let i = 1; i <= 8; i++) {
        tempChosenCourses[i].forEach(coursename => {
          // Use tempChosenCourses inside check_prereqs
          const [flagcourse, pre_reqs1] = check_prereqs(coursename, i);
          console.log('flagcourse: '+flagcourse);
          if (flagcourse && mainCourseData.find(course => course.name === coursename).pre_reqs.length !== 0) {
            flagend = 1;
            alert('alert1:\n'+'course: ' + coursename+ '\n' + 'pre-requisites: ' + pre_reqs1+' not satisfied!');
          }
        });
      }
    }
    console.log('flagend: '+flagend);
    if (!flagend) {
      // target sem div
      if (sem !== 'courseContainer') {
        if (!chosenCourses[sem].includes(courseName)) {
          console.log('call1');
          chosenCourses[sem].push(courseName);
        }
      }
      if (ogSem !== 'courseContainer') {
        // remove the course from the original container in chosenCourses
        const index = chosenCourses[ogSem].indexOf(courseName);
        if (index > -1) {
          const prevSemdiv = target.parentNode.parentNode.querySelector(`#Semester-${ogSem}`);
          const prevSemtarget = target.parentNode.parentNode.querySelector(`#sem${ogSem}`);
          prevSemtarget.setAttribute('credits',parseInt(prevSemtarget.getAttribute('credits')) - course.credits);
          console.log(prevSemtarget);
          if (prevSemdiv) {
            prevSemdiv.textContent = `Semester ${ogSem}\n Credits: ${prevSemtarget.getAttribute('credits')}`;
          }
          if (ogSem!=sem) {
            chosenCourses[ogSem].splice(index, 1);
          }
          console.log('call2');
        }
      }
      console.log(chosenCourses);
    
      //target.appendChild(elem);
      target.insertBefore(elem, target.firstChild);
      const attributeValue = target.getAttribute('credits');
      const innerDiv1 = target.parentNode.querySelector(`#Semester-${sem}`);
      console.log(innerDiv1);
      if (innerDiv1) {
        innerDiv1.textContent = `Semester ${sem}\n Credits: ${parseInt(attributeValue) + parseInt(course.credits)}`;
      }
      target.setAttribute('credits',parseInt(attributeValue) + parseInt(course.credits));
      console.log(target);
    }
  }else{
    if ((parseInt(target.getAttribute('credits'))+parseInt(course.credits))>22) {
      alert('course cap exceeded');
    }else{
      alert('alert2\n'+'course: '+courseName+'\n'+'pre-requisites: '+pre_reqs+' not satisfied');
    }
  }
}

async function updateCourses(exec=0) {
  const major = document.querySelector('#major').value;
  const query = document.querySelector('#courseQuery').value;
  const courses = await getCourses({ query,major,exec });

  const container = document.querySelector('#courseContainer');
  container.innerHTML = '';

  let selectedCourses = document.getElementsByName('courseDiv');
  selectedCourses = Array.from(selectedCourses).map((course) => course.id);

  courses.forEach((course) => {
    console.log(course.name);
    if (selectedCourses.includes(course.code)) {
      return;
    }

    const div = document.createElement('div');
    div.classList.add('m-1', 'pt-[3px]', 'bg-slate-100', 'shadow','border-2','border-[#003049]');
    div.setAttribute('name', 'courseDiv');
    div.setAttribute('draggable', 'true');
    div.ondragstart = (event) => drag(event);
    // set div id as course name
    div.setAttribute('id', course.name);
    // div.setAttribute('id', course.code);

    const courseName = document.createElement('p');
    courseName.classList.add('text-center', 'm-0','mb-2', 'font-medium','font-mono','text-base','underline', 'underline-offset-4');
    courseName.textContent = course.name;

    const courseCode = document.createElement('p');
    courseCode.classList.add('text-center', 'm-0','mb-2','font-mono','text-sm');
    courseCode.textContent = course.code;

    const courseCredits = document.createElement('p');
    courseCredits.classList.add('text-center', 'm-0','mt-2','py-1','font-mono','text-sm','bg-slate-200');
    courseCredits.textContent = 'Credits: '+course.credits;

    const coursePrereqs = document.createElement('div');
    coursePrereqs.classList.add('text-center', 'm-0', 'font-mono', 'text-sm', 'relative');

    const collapsibleHeader = document.createElement('button');
    collapsibleHeader.classList.add('border', 'border-gray-300', 'rounded-md', 'py-1', 'px-3', 'text-xs', 'bg-cyan-500', 'shadow-sm', 'focus:outline-none');
    collapsibleHeader.textContent = 'view prerequisites';

    const collapsibleContent = document.createElement('div');
    collapsibleContent.classList.add('hidden', 'border', 'border-gray-300', 'shadow-lg', 'py-2', 'z-10', 'max-h-32', 'overflow-y-auto','text-xs');
    if (course.pre_reqs.length !=0) {
      collapsibleContent.textContent = course.pre_reqs; // Assign prerequisites content here
    }else{
      collapsibleContent.textContent = 'NA';
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
    div.appendChild(courseName);
    div.appendChild(courseCode);
    div.appendChild(coursePrereqs);
    div.appendChild(courseCredits);
    container.appendChild(div);
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
    div.classList.add('p-0', 'm-0', 'border-[2px]', 'border-black', 'w-full', 'h-full', 'shadow', 'bg-slate-100','overflow-hidden');

    const innerDiv1 = document.createElement('div');
    innerDiv1.classList.add('text-center', 'text-white', 'font-mono', 'bg-[#c1121f]', 'py-2', 'mt-0', 'mb-0', 'text-base','border-b-[2px]', 'border-black');
    innerDiv1.setAttribute('id',`Semester-${sem}`)
    // Add attribute to innerDiv2 and display its value in innerDiv1
    const innerDiv2 = document.createElement('div');
    innerDiv2.classList.add('mx-auto', 'px-4', 'py-5', 'w-full', 'h-full','overflow-y-scroll');
    innerDiv2.ondrop = (event) => drop(event);
    innerDiv2.ondragover = (event) => allowDrop(event);
    innerDiv2.setAttribute('id', `sem${sem}`);
    innerDiv2.setAttribute('credits', '0');
    innerDiv1.textContent = `Semester ${sem}\nCredits: ${innerDiv2.getAttribute('credits')}`; // Display attribute value in innerDiv1

    innerDiv2.setAttribute('droppable', 'true');
    div.appendChild(innerDiv1);
    div.appendChild(innerDiv2);

    semContainer.appendChild(div);
  }
  updateCourses();
};

function rec_courses(){
  const courseContainer = document.querySelector('#courseContainer');
  if(Object.values(chosenCourses).slice(1, 9).every(arr => arr.length === 0)){
    // add courses to semesters
    for (let i = courseContainer.children.length - 1; i >= 0; i--) {
      const courseDiv = courseContainer.children[i];
      console.log('div');
      console.log('course: '+courseDiv.getAttribute('id'));
      const course = mainCourseData.find((course) => course.name === courseDiv.getAttribute('id'));
      const semester = parseInt(course.sem_no);
      if (semester) {
          console.log(semester);
          console.log('course: ' + chosenCourses[parseInt(course.sem_no)]);
          const semesterDiv = document.querySelector(`#sem${course.sem_no}`);
          const semesertDivCredit = document.querySelector(`#Semester-${course.sem_no}`);
          chosenCourses[parseInt(course.sem_no)].push(course.name);
          semesterDiv.insertBefore(courseDiv, semesterDiv.firstChild);
          if (semesertDivCredit) {
            semesertDivCredit.textContent = `Semester ${course.sem_no}\n Credits: ${parseInt(semesterDiv.getAttribute('credits')) + parseInt(course.credits)}`;
          }
          semesterDiv.setAttribute('credits',parseInt(semesterDiv.getAttribute('credits')) + parseInt(course.credits));
        if (courseDiv.parentNode === courseContainer) {
            courseContainer.removeChild(courseDiv);
        }
      }
    }
  }else{
    // clear
    updateCourses(1);
  }
};