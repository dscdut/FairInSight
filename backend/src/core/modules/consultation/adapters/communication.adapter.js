export class CommunicationAdapter {
    async startSession(processId, payload) {
        throw new Error('Method startSession() must be implemented');
    }
    async endSession(processId, payload) {
        throw new Error('Method endSession() must be implemented');
    }
}
