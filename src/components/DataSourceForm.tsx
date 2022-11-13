import React  from "react";

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
	onSuccess: (dataUrl: string, data: any) => void ,
	getJson: (url: string) => Promise<any>
}) => {
	const [sampleDataUrls, setSampleDataUrls] = React.useState<{name:string,path:string}[]>([]);
	React.useEffect(() => {
		const effect = async () => {
			let response = await fetch('/sample-data/index.json');
			let sampleDataUrls: {name:string,path:string}[] = await response.json();
			setSampleDataUrls(sampleDataUrls);
		};
		effect();
	}, []);

	React.useEffect(() => {
		setLocalDataUrl(dataUrl);
	},[dataUrl]);

	const [localDataUrl,setLocalDataUrl] = React.useState<string>(dataUrl);
	const continueWithDataUrl = async (dataUrl: string) => {
		let data = await getJson(dataUrl);
		console.log('data', data);
		if (!data) {
			alert("invalid URL or JSON data");
			return;
		}
		onSuccess(dataUrl,data);
	};

	return <div>
		<div className="input-group input-group-lg">
			<div className="form-floating form-floating-group flex-grow-1">
					<input type="text"
						id="json_url"
						disabled={!!clear}
						className="form-control"
						value={localDataUrl}
						onChange={e => {
							e.preventDefault();
							setLocalDataUrl(e.target.value);
						}}
					/>
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
					onClick={() => continueWithDataUrl(localDataUrl)}
				>Continue with JSON data</button>
			}
		</div>
		{!clear && 
			<div className="mt-5">
				<div className="row">
					<div className="col-md-6">
					</div>
					<div className="col-md-6">
						<p>Load sample data:</p>
						<div className="list-group">
							{sampleDataUrls.map(url => 
								<a className="list-group-item list-group-action" href="" onClick={e => {
									e.preventDefault();
									continueWithDataUrl(url.path);
								}}>
									{url.name}
								</a>
							)}
						</div>
					</div>
				</div>
			</div>
		}
	</div>
};