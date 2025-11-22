chrome.runtime.onMessage.addListener((message, sender, sendResponse)=>{
    if(message.action === "generateComment"){
        const [post, prompt] = message.text.split("\\\n");
        console.log(prompt)
        fetch('https://aicommentor.onrender.com/AIcomments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({post: post, prompt: prompt})
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