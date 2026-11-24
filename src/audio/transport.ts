export type TransportStatus = 'stopped' | 'playing' | 'paused'

export type PlayRequest = { type: 'ignore' } | { type: 'start'; token: number; fromBeat: number }

/**
 * Serializes Play so a second gesture cannot stack another scheduler
 * on top of one that has not committed yet.
 */
export class TransportGate {
  status: TransportStatus = 'stopped'
  beat = 0
  interrupted = false
  private token = 0

  requestPlay(): PlayRequest {
    if (this.status === 'playing') return { type: 'ignore' }
    const token = ++this.token
    return { type: 'start', token, fromBeat: this.status === 'paused' ? this.beat : 0 }
  }

  commit(token: number): boolean {
    if (token !== this.token || this.status === 'playing') return false
    this.status = 'playing'
    this.interrupted = false
    return true
  }

  pause(beat: number): void {
    if (this.status !== 'playing') return
    this.token += 1
    this.status = 'paused'
    this.beat = Math.max(0, beat)
    this.interrupted = false
  }

  interrupt(beat: number): void {
    if (this.status !== 'playing') return
    this.token += 1
    this.status = 'paused'
    this.beat = Math.max(0, beat)
    this.interrupted = true
  }

  stop(): void {
    this.token += 1
    this.status = 'stopped'
    this.beat = 0
    this.interrupted = false
  }
}
