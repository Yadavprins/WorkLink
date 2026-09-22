let io = null;

const setIO = (socketServer) => {
    io = socketServer;
};

const emitToJob = (jobId, event, payload) => {
    if (io) {
        io.to(`job:${jobId}`).emit(event, payload);
    }
};

const getIO = () => io;

module.exports = {
    setIO,
    emitToJob,
    getIO
};
