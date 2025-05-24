const Account = require('../models/Account.model');
const Attendee = require('../models/Attendee.model');
const Event = require('../models/Event.model');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await AccountModel.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: 'Username already exists',
      });
    }
    const hash = await AccountModel.hashPassword(password);
    // Create new user
    const newUser = await AccountModel.create({
      username,
      email,
      password: hash,
    });
    res.status(201).json({
      status: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
        },
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error',
    });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const rememberMe = req.body.rememberMe || false;
  try {
    if (!username || !password) {
      return res.status(400).json({
        status: false,
        message: 'Username and password are required',
      });
    }

    // Check if user exists
    const user = await AccountModel.findOne({ username });
    if (!user) {
      return res.status(401).json({
        status: false,
        message: 'Invalid username or password',
      });
    }
    // console.log(user)
    // Check if password is correct
    const isPasswordCorrect = await AccountModel.comparePassword(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: false,
        message: 'Invalid username or password',
      });
    }
    // Generate JWT token
    const token = AccountModel.generateAuthToken(user, rememberMe);
    // console.log(token)
    res.status(200).json({
      status: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error',
    });
  }
};


exports.editUser = async (req, res) => {
  const { id } = req.params;
  const { name, username, email, password } = req.body;

  try {
    // Find the user by ID
    const user = await AccountModel.findById(id);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User not found',
      });
    }
    // Update user details
    user.name = name || user.name;
    user.username = username || user.username;
    user.email = email || user.email;
    if (password) {
      user.password = await AccountModel.hashPassword(password);
    }
    await user.save();
    res.status(200).json({
      status: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
        },
      },
    });
  }
  catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error',
    });
  }
}

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the user by ID
    const user = await AccountModel.findById(id);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User not found',
      });
    }
    // Delete the user
    await user.remove();
    res.status(200).json({
      status: true,
      message: 'User deleted successfully',
    });
  }
  catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error',
    });
  }
}


exports.getUser = async (req, res) => {
  // const { id } = req.params;

  try {
    // Find the user by ID
    const user = await AccountModel.findById(req.user.id).populate('events');
    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User not found',
      });
    }
    res.status(200).json({
      status: true,
      message: 'User retrieved successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
        },
        events: user.events?.map(event => ({
          id: event._id,
          name: event.name,
          date: event.date,
          location: event.location,
        })) || [],
      },
    });
  }
  catch (error) {
    console.error('Error retrieving user:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error',
    });
  }
}


exports.getAllUsers = async (req, res) => {
  try {
    const users = await AccountModel.find();
    res.status(200).json({
      status: true,
      message: 'Users retrieved successfully',
      data: {
        users: users.map(user => ({
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
        })),
      },
    });
  }
  catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error',
    });
  }
}

exports.getUserEvents = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the user by ID
    const user = await AccountModel.findById(id).populate('events');
    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User not found',
      });
    }
    res.status(200).json({
      status: true,
      message: 'User events retrieved successfully',
      data: {
        events: user.events?.map(event => ({
          id: event._id,
          name: event.name,
          date: event.date,
          location: event.location,
        })) || [],
      },
    });
  }
  catch (error) {
    console.error('Error retrieving user events:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error',
    });
  }
}



exports.getUserDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();

    // 1. Get total events count
    const totalEvents = await EventModel.countDocuments({ account: userId });

    // 2. Get total attendees across all events
    const events = await EventModel.find({ account: userId }).populate('attendees');
    const totalAttendees = events.reduce(
      (sum, event) => sum + (event.attendees?.length || 0),
      0
    );

    // 3. Get upcoming events (using status OR start date filtering)
    const upcomingEvents = await EventModel.find({
      account: userId,
      $or: [
        { status: { $in: ['upcoming', 'active', 'ongoing'] } },
        { startDate: { $gte: currentDate } }
      ]
    })
    .sort({ startDate: 1 })
    .limit(3);

    // 4. Get recent events (sorted by creation date)
    const recentEvents = await EventModel.find({ account: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('attendees');

    // 5. Get recent attendees (across all events)
    const recentAttendees = await AttendeeModel.find({
      event: { $in: events.map(e => e._id) }
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('event');

    res.status(200).json({
      success: true,
      data: {
        totalEvents,
        totalAttendees,
        upcomingEvents: upcomingEvents.map((event) => ({
          id: event._id,
          name: event.name,
          startDate: event.startDate,
          endDate: event.endDate,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          status: event.status,
          attendeesCount: event.attendees?.length || 0,
          image: event.image,
          capacity: event.capacity,
          isPublic: event.isPublic
        })),
        recentEvents: recentEvents.map((event) => ({
          id: event._id,
          name: event.name,
          startDate: event.startDate,
          endDate: event.endDate,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          description: event.description,
          status: event.status,
          attendeesCount: event.attendees?.length || 0,
          capacity: event.capacity,
          isPublic: event.isPublic
        })),
        recentAttendees: recentAttendees.map((attendee) => ({
          id: attendee._id,
          name: attendee.name,
          email: attendee.email,
          phone: attendee.phone,
          eventId: attendee.event._id,
          eventName: attendee.event.name
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: error.message
    });
  }
};