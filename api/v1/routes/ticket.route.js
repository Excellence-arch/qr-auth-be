const router = require('express').Router();
const {
  getTicketById,
  createTicket,
  getAllTickets,
} = require('../controllers/ticket.controller');
const { auth } = require('../middlewares/auth.middleware');

router.post('/add', auth(), createTicket);
router.get('/all', auth(), getAllTickets);
router.get('/:ticketId', auth(), getTicketById);
// router.put('/:ticketId', auth(), updateTicket);
// router.delete('/:ticketId', auth(), deleteTicket);

module.exports = router;