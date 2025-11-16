chrome.runtime.onMessage.addListener((message, sender, sendResponse)=>{
    if(message.action === "generateComment"){
        fetch('http://127.0.0.1:8000/AIcomments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({post: message.text})
        })
        .then(res=> res.json())
        .then(data=>{
            sendResponse({success: true,  comments: data.comment})
        })
        .catch(err=>{
            sendResponse({success:false, error: err.toString()})
        });
        return true;
    }

})