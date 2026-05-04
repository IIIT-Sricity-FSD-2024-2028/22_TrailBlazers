CREATE TABLE User (
    user_id INT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(15),
    password VARCHAR(100),
    status VARCHAR(20)
);

CREATE TABLE Client (
    client_id INT PRIMARY KEY,
    user_id INT UNIQUE,
    organization_name VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES User(user_id)
);

CREATE TABLE Attendee (
    attendee_id INT PRIMARY KEY,
    user_id INT UNIQUE,
    registration_status VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES User(user_id)
);

CREATE TABLE EventManager (
    manager_id INT PRIMARY KEY,
    user_id INT UNIQUE,
    experience_level VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES User(user_id)
);

CREATE TABLE Coordinator (
    coordinator_id INT PRIMARY KEY,
    user_id INT UNIQUE,
    assigned_zone VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES User(user_id)
);

CREATE TABLE PendingRequest (
    request_id INT PRIMARY KEY,
    status VARCHAR(50),
    date DATE,
    client_id INT,
    FOREIGN KEY (client_id) REFERENCES Client(client_id)
);

CREATE TABLE Event (
    event_id INT PRIMARY KEY,
    title VARCHAR(200),
    description TEXT,
    date DATE,
    location VARCHAR(200),
    status VARCHAR(50),
    created_at TIMESTAMP,
    client_id INT,
    manager_id INT,
    coordinator_id INT,
    FOREIGN KEY (client_id) REFERENCES Client(client_id),
    FOREIGN KEY (manager_id) REFERENCES EventManager(manager_id),
    FOREIGN KEY (coordinator_id) REFERENCES Coordinator(coordinator_id)
);

CREATE TABLE RSVP (
    attendee_id INT,
    event_id INT,
    rsvp_date DATE,
    status VARCHAR(50),
    PRIMARY KEY (attendee_id, event_id),
    FOREIGN KEY (attendee_id) REFERENCES Attendee(attendee_id),
    FOREIGN KEY (event_id) REFERENCES Event(event_id)
);

CREATE TABLE Session (
    session_id INT PRIMARY KEY,
    topic VARCHAR(200),
    start_time TIME,
    end_time TIME,
    event_id INT,
    FOREIGN KEY (event_id) REFERENCES Event(event_id)
);

CREATE TABLE Poll (
    poll_id INT PRIMARY KEY,
    question TEXT,
    created_at TIMESTAMP,
    event_id INT,
    FOREIGN KEY (event_id) REFERENCES Event(event_id)
);

CREATE TABLE PollOption (
    option_id INT PRIMARY KEY,
    label VARCHAR(200),
    votes INT DEFAULT 0,
    poll_id INT,
    FOREIGN KEY (poll_id) REFERENCES Poll(poll_id)
);

CREATE TABLE QnA (
    qna_id INT PRIMARY KEY,
    question TEXT,
    event_id INT,
    attendee_id INT,
    client_id INT,
    FOREIGN KEY (event_id) REFERENCES Event(event_id),
    FOREIGN KEY (attendee_id) REFERENCES Attendee(attendee_id),
    FOREIGN KEY (client_id) REFERENCES Client(client_id)
);

CREATE TABLE Feedback (
    feedback_id INT PRIMARY KEY,
    rating INT,
    comment TEXT,
    created_at TIMESTAMP,
    attendee_id INT,
    event_id INT,
    FOREIGN KEY (attendee_id) REFERENCES Attendee(attendee_id),
    FOREIGN KEY (event_id) REFERENCES Event(event_id)
);

CREATE TABLE Report (
    report_id INT PRIMARY KEY,
    attendance_count INT,
    poll_participation INT,
    feedback_score FLOAT,
    generated_at TIMESTAMP,
    event_id INT UNIQUE,
    FOREIGN KEY (event_id) REFERENCES Event(event_id)
);

CREATE TABLE Notification (
    notification_id INT PRIMARY KEY,
    user_id INT,
    title VARCHAR(200),
    message TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(user_id)
);

CREATE TABLE Check_in (
    check_in_id INT PRIMARY KEY,
    check_in_time TIMESTAMP,
    status VARCHAR(50),
    attendee_id INT,
    event_id INT,
    FOREIGN KEY (attendee_id) REFERENCES Attendee(attendee_id),
    FOREIGN KEY (event_id) REFERENCES Event(event_id)
);

CREATE TABLE TeamMember (
    team_id INT PRIMARY KEY,
    role VARCHAR(50),
    user_id INT,
    event_id INT,
    FOREIGN KEY (user_id) REFERENCES User(user_id),
    FOREIGN KEY (event_id) REFERENCES Event(event_id)
);



