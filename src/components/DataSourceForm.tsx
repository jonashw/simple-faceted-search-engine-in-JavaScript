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
	onSuccess: (data: any) => void ,
	getJson: (url: string) => Promise<any>
}) => {
	const load = async (dataUrl: string) => {
		let data = await getJson(dataUrl);
		console.log('data', data);
		if (!data) {
			alert("invalid URL or JSON data");
			return;
		}
		onSuccess(data);
	};

	const [sampleDataUrls, setSampleDataUrls] = React.useState<string[]>([]);

	React.useEffect(() => {
		const effect = async () => {
			let response = await fetch('/sample-data/index.json');
			let sampleDataUrls: string[] = await response.json();
			setSampleDataUrls(sampleDataUrls);
		};
		effect();
	}, []);

	return <div>
		<div className="input-group input-group-lg">
			<div className="form-floating form-floating-group flex-grow-1">
					<input type="text"
						id="json_url"
						disabled={!!clear}
						className="form-control"
						value={dataUrl}
						onChange={e => {
							e.preventDefault();
							setDataUrl(e.target.value);
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
					onClick={() => load(dataUrl)}
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
									setDataUrl(url);
								}}>
									{url}
								</a>
							)}
						</div>
					</div>
				</div>
			</div>
		}
	</div>
};