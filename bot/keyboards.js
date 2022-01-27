export class MenuKeyboards {
	parsedProducts(device, storages) {
      const storageKeyboard = []
      let rows = []
      const itemsCount = Object.keys(storages).length
      let indexRows = 0
      let indexCount = 0
      for (let item in storages) {
         const checkbox = storages[item] ? '✅' : ''
         rows.push({
            text: `${checkbox} ${item}`,
            callback_data: `~${device}|${item}`,
         })
         indexRows++
         indexCount++
         if(indexRows === 2) {
            storageKeyboard.push(rows)
            rows = []
            indexRows = 0
         }
         if(indexCount === itemsCount) {
            if(rows.length > 0) storageKeyboard.push(rows)
         }
      }
      return storageKeyboard
	}

	existProducts(products) {
      const storageKeyboard = []
		for (let product of products) {
			const { device, storage } = product
         storageKeyboard.push([{
            text: `${device} ~ ${storage} ❌`,
            callback_data: `delete_${device}|${storage}`,
         }])
		}
      return storageKeyboard
	}
}