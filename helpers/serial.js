const Serial = {
  port: undefined,
  async init(baudRate=9600) {
    if ("serial" in navigator) {
      this.port = await navigator.serial.requestPort()
      await this.port.open({ baudRate })
      console.log("Serial started.")
      Serial.start()
    } else {
      console.warning("Serial is not supported.")
    }
  },

  async start(update) {
    while (this.port.readable) {
      const reader = this.port.readable.getReader()
      try {
        while (true) {
          const { value, done } = await reader.read()
          if (done) { break }

          // decode serial message assuming all incoming messages are strings
          let msg = ""
          for (let i = 0; i < value.length; i++) {
            msg = msg.concat(String.fromCharCode(value[i]))
          }

          // udpate state based on message
          update(msg)
        }
      } catch (error) {
        console.error(error)
      } finally {
        reader.releaseLock()
      }
    }

    console.log("Serial stopped.")
  }
}

export default Serial
