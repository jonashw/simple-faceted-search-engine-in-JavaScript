export default ({
	dataUrl,
	setDataUrl,
	clear,
	onSuccess,
	getJson
}: {
	dataUrl: string,
	setDataUrl: (du: string) => void,
	clear?: () => void,
	onSuccess: (data: any) => void ,
	getJson: (url: string) => Promise<any>
}) => {
  const load = async () => {
    let data = await getJson(dataUrl);
    console.log('data',data);
    if(!data){
      alert("invalid URL or JSON data");
      return;
    }
		onSuccess(data);
  };

	return <div>
		<div className="input-group input-group-lg">
			<div className="form-floating form-floating-group flex-grow-1">
					<input type="text"
						id="json_url"
						disabled={!!clear}
						className="form-control"
						defaultValue={dataUrl}
						onChange={e => setDataUrl(e.target.value) 
					}/>
					<label htmlFor="json_url">URL to JSON data</label>
			</div>
			
			{!!clear 
			?
				<button className="btn btn-danger"
					onClick={clear}
				>Clear</button>
			:
				<button
					className="btn btn-success"
					onClick={() => load()}
				>Continue with JSON data</button>
			}
		</div>
	</div>
};