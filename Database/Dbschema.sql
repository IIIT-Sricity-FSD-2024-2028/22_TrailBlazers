CREATE TABLE User (
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(15),
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20),
  PRIMARY KEY (user_id),
  UNIQUE (email),
  UNIQUE (phone)
);

CREATE TABLE Client (
  client_id INT NOT NULL,
  organization_name VARCHAR(150) NOT NULL,
  PRIMARY KEY (client_id),
  FOREIGN KEY (client_id) REFERENCES User(user_id) ON DELETE CASCADE
);

CREATE TABLE Coordinator (
  coordinator_id INT NOT NULL,
  assigned_zone VARCHAR(100),
  PRIMARY KEY (coordinator_id),
  FOREIGN KEY (coordinator_id) REFERENCES User(user_id) ON DELETE CASCADE
);

CREATE TABLE Event_Manager (
  manager_id INT NOT NULL,
  experience_level VARCHAR(50),
  PRIMARY KEY (manager_id),
  FOREIGN KEY (manager_id) REFERENCES User(user_id) ON DELETE CASCADE
);

CREATE TABLE Attendee (
  attendee_id INT NOT NULL,
  registration_status VARCHAR(30),
  PRIMARY KEY (attendee_id),
  FOREIGN KEY (attendee_id) REFERENCES User(user_id) ON DELETE CASCADE
);

CREATE TABLE Event (
  event_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  location VARCHAR(200),
  status VARCHAR(30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  client_id INT NOT NULL,
  manager_id INT,
  coordinator_id INT,
  PRIMARY KEY (event_id),
  FOREIGN KEY (client_id) REFERENCES Client(client_id),
  FOREIGN KEY (manager_id) REFERENCES Event_Manager(manager_id),
  FOREIGN KEY (coordinator_id) REFERENCES Coordinator(coordinator_id)
);

CREATE TABLE Session (
  session_id INT NOT NULL,
  topic VARCHAR(200) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  event_id INT NOT NULL,
  PRIMARY KEY (session_id),
  FOREIGN KEY (event_id) REFERENCES Event(event_id) ON DELETE CASCADE
);

CREATE TABLE Poll (
  poll_id INT NOT NULL,
  question TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  event_id INT NOT NULL,
  PRIMARY KEY (poll_id),
  FOREIGN KEY (event_id) REFERENCES Event(event_id) ON DELETE CASCADE
);

CREATE TABLE Poll_Response (
  response_id INT NOT NULL,
  answer TEXT NOT NULL,
  poll_id INT NOT NULL,
  attendee_id INT NOT NULL,
  PRIMARY KEY (response_id),
  FOREIGN KEY (poll_id) REFERENCES Poll(poll_id) ON DELETE CASCADE,
  FOREIGN KEY (attendee_id) REFERENCES Attendee(attendee_id) ON DELETE CASCADE
);

CREATE TABLE Check_In (
  check_in_id INT NOT NULL,
  status VARCHAR(20),
  check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  event_id INT NOT NULL,
  attendee_id INT NOT NULL,
  PRIMARY KEY (check_in_id),
  FOREIGN KEY (event_id) REFERENCES Event(event_id) ON DELETE CASCADE,
  FOREIGN KEY (attendee_id) REFERENCES Attendee(attendee_id) ON DELETE CASCADE
);

CREATE TABLE RSVP (
  rsvp_id INT NOT NULL,
  rsvp_date DATE NOT NULL,
  status VARCHAR(20),
  event_id INT NOT NULL,
  attendee_id INT NOT NULL,
  PRIMARY KEY (rsvp_id),
  UNIQUE(event_id, attendee_id),
  FOREIGN KEY (event_id) REFERENCES Event(event_id) ON DELETE CASCADE,
  FOREIGN KEY (attendee_id) REFERENCES Attendee(attendee_id) ON DELETE CASCADE
);

CREATE TABLE Feedback (
  feedback_id INT NOT NULL,
  rating INT,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  attendee_id INT NOT NULL,
  event_id INT NOT NULL,
  PRIMARY KEY (feedback_id),
  FOREIGN KEY (attendee_id) REFERENCES Attendee(attendee_id),
  FOREIGN KEY (event_id) REFERENCES Event(event_id)
);

CREATE TABLE Report (
  report_id INT NOT NULL,
  attendance_count INT DEFAULT 0,
  poll_participation INT DEFAULT 0,
  feedback_score DECIMAL(3,2),
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  event_id INT,
  PRIMARY KEY (report_id),
  UNIQUE(event_id),
  FOREIGN KEY (event_id) REFERENCES Event(event_id) ON DELETE CASCADE
);