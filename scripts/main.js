// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyAhs4Ugm5QtM32l26v4Uijias_GofJ-3yc",
    authDomain: "stonkoverflow.firebaseapp.com",
    databaseURL: "https://stonkoverflow.firebaseio.com",
    projectId: "stonkoverflow",
    storageBucket: "stonkoverflow.appspot.com",
    messagingSenderId: "911990920857",
    appId: "1:911990920857:web:beed4bb135361320068a08",
    measurementId: "G-61N5THWPLZ"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();
const firestore = firebase.firestore();

class User {
    constructor(id, name, points){
        this.id = id;
        this.name = name;
        this.points = points;
    }
}

class Question {
    constructor(id, authorid, title, content, points, timestamp){
        this.id = id;
        this.authorid = authorid;
        this.title = title;
        this.content = content;
        this.points = points;
        this.timestamp = timestamp;
    }
}


function addQuestion(doc){
    // <div class="row justify-content-center">
    //     <div class="col-lg-1 border">
    //         points
    //     </div>
    //     <div class="col-lg-6 border">
    //         title by author
    //     </div>
    //   </div>

    const mainSectionElement = document.getElementById('mainSection');
    const question = new Question(doc.id, doc.data().authorid, doc.data().title, doc.data().content, doc.data().points,
        doc.data().timestamp);

    let authorName = "undefined";
    var userReference = firestore.collection('users').doc(question.authorid);
    userReference.get().then(function(userDocument){
        if(userDocument.exists){
            let rowDiv = document.createElement('div');
            rowDiv.setAttribute('class', 'row justify-content-center mb-5');
            mainSectionElement.appendChild(rowDiv);

            let firstColDiv = document.createElement('div');
            firstColDiv.setAttribute('class', 'col-lg-1 text-center');
            firstColDiv.innerHTML = question.points + ' points';
            rowDiv.appendChild(firstColDiv);

            let secondColDiv = document.createElement('div');
            secondColDiv.setAttribute('class', 'col-lg-6');
            secondColDiv.innerHTML = '<h4><a href="question.html?id=' + question.id + '">' + question.title + '</a></h4>' +
                'Asked by <a href="user.html?id=' + userDocument.id + '">' + userDocument.data().name + '</a> on ' + 
                getPrintableDate(question.timestamp);
            rowDiv.appendChild(secondColDiv);
        }
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });
}

function loadQuestions(){
    firestore.collection('questions').orderBy('timestamp', 'desc').limit(15)
    .get().then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
          addQuestion(doc);
        });
    });
}

function loadQuestion(){
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const articleID = urlParams.get('id');

    if(articleID == null || articleID == undefined)
        return;
    
    var questionReference = firestore.collection('questions').doc(articleID);
    questionReference.get().then(function(questionDocument){
        if(questionDocument.exists){
            const question = new Question(questionDocument.id, questionDocument.data().authorid, questionDocument.data().title, 
                questionDocument.data().content, questionDocument.data().points, questionDocument.data().timestamp);

            var userReference = firestore.collection('users').doc(question.authorid);
            userReference.get().then(function(userDocument){
                if(userDocument.exists){
                    const user = new User(userDocument.id, userDocument.data().name, userDocument.data().points);

                    // Set page title
                    document.title = question.title + ' | Stonkoverflow';

                    const mainSectionElement = document.getElementById('mainSection');
                
                    let rowDiv = document.createElement('div');
                    rowDiv.setAttribute('class', 'row justify-content-center');
                    mainSectionElement.appendChild(rowDiv);
                
                    let firstColDiv = document.createElement('div');
                    firstColDiv.setAttribute('class', 'col-lg-7');
                    firstColDiv.innerHTML = '<h4>' + question.title + '</h4>';
                    rowDiv.appendChild(firstColDiv);

                    let secondColDiv = document.createElement('div');
                    secondColDiv.setAttribute('class', 'mb-2 col-lg-7');
                    secondColDiv.innerHTML = 'Asked by <a href="user.html?id=' + user.id + '">' + user.name + '</a> on ' + 
                        getPrintableDate(question.timestamp);
                    rowDiv.appendChild(secondColDiv);

                    let breakBeforePointsDiv = document.createElement('div');
                    breakBeforePointsDiv.setAttribute('class', 'w-100');
                    rowDiv.appendChild(breakBeforePointsDiv);

                    // let thirdColDiv = document.createElement('div');
                    // thirdColDiv.setAttribute('class', 'col-lg-1');
                    // thirdColDiv.innerHTML = question.points;
                    // rowDiv.appendChild(thirdColDiv);

                    let fourthColDiv = document.createElement('div');
                    fourthColDiv.setAttribute('class', 'col-lg-7');
                    fourthColDiv.innerHTML = question.content;
                    rowDiv.appendChild(fourthColDiv);

                    loadComments(question.id);
                }
            }).catch(function(error) {
                console.log("Error getting document:", error);
            });
        }
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });
}

function getPrintableDate(timestamp){
    var date = timestamp.toDate(); // Firestore.Timestamp -> JS.Date
    return ('0' + date.getDate()).slice(-2) +
        '.' +
        ('0' + date.getMonth()).slice(-2) +
        '.' +
        date.getFullYear();
}

function addComment(commentDocument){
    const mainSectionElement = document.getElementById('mainSection');
    const question = new Question(doc.id, doc.data().authorid, doc.data().title, doc.data().content, doc.data().points);

    let rowDiv = document.createElement('div');
    rowDiv.setAttribute('class', 'row justify-content-center');
    mainSectionElement.appendChild(rowDiv);

    let firstColDiv = document.createElement('div');
    firstColDiv.setAttribute('class', 'col-lg-1 border text-center');
    firstColDiv.innerHTML = question.points + ' points';
    rowDiv.appendChild(firstColDiv);

    let secondColDiv = document.createElement('div');
    secondColDiv.setAttribute('class', 'col-lg-6 border');
    secondColDiv.innerHTML = '<h4><a href="question.html?id=' + question.id + '">' + question.title + '</a></h4>' +
        'Asked by ' + question.authorid;
    rowDiv.appendChild(secondColDiv);
}

function loadComments(questionid){
    firestore.collection('questions').document(questionid).collection('comments').onSnapshot(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
            addComment(doc);
        });
    });
}