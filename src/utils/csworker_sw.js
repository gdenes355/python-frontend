const STANDALONE_BUILD = false;

onInitDone = () => {
	//self.postMessage({ cmd: 'init-done' });
	BINDING.call_static_method("[Sponge.Compiler]Sponge.Compiler.Program:Warmup", []);
}

config = {
	vfs_prefix: "managed",
	deploy_prefix: "managed",
	enable_debugging: 0,
	file_list: [ "Sponge.Compiler.dll","mscorlib.dll","System.Net.Http.dll","System.dll","Mono.Security.dll","System.Xml.dll","System.Numerics.dll","System.Core.dll","WebAssembly.Net.WebSockets.dll","netstandard.dll","System.Data.dll","System.Transactions.dll","System.Data.DataSetExtensions.dll","System.Drawing.Common.dll","System.IO.Compression.dll","System.IO.Compression.FileSystem.dll","System.ComponentModel.Composition.dll","System.Runtime.Serialization.dll","System.ServiceModel.Internals.dll","System.Xml.Linq.dll","WebAssembly.Bindings.dll","System.Memory.dll","WebAssembly.Net.Http.dll","Microsoft.CodeAnalysis.dll","System.Runtime.dll","System.Diagnostics.Debug.dll","System.Collections.Immutable.dll","System.Collections.dll","System.Reflection.Metadata.dll","System.Globalization.dll","System.Reflection.dll","System.IO.dll","System.IO.FileSystem.dll","System.Runtime.Extensions.dll","System.Collections.Concurrent.dll","System.Text.Encoding.dll","System.Linq.dll","System.Threading.Tasks.dll","System.Security.Cryptography.Algorithms.dll","System.Threading.dll","System.ValueTuple.dll","System.Xml.XDocument.dll","System.Security.Cryptography.Primitives.dll","System.Runtime.InteropServices.dll","System.Reflection.Primitives.dll","System.Diagnostics.Tools.dll","System.Resources.ResourceManager.dll","System.IO.FileSystem.Primitives.dll","System.Xml.ReaderWriter.dll","System.Runtime.Numerics.dll","System.Threading.Tasks.Extensions.dll","System.Xml.XPath.XDocument.dll","System.Reflection.Extensions.dll","System.Text.Encoding.CodePages.dll","System.Text.Encoding.Extensions.dll","Microsoft.CodeAnalysis.CSharp.dll","System.Linq.Expressions.dll","System.Threading.Tasks.Parallel.dll","Newtonsoft.Json.dll" ],
}

var Module = {
	onRuntimeInitialized: function () {
		MONO.mono_load_runtime_and_bcl (
		config.vfs_prefix,
		config.deploy_prefix,
		config.enable_debugging,
		config.file_list,
		function () {
			// loading finished
			onInitDone();
		}
	)
	},
};

importScripts("/static/js/mono/dotnet.js");

onmessage = (e) => {
	if (e.data.cmd === 'setSharedBuffers') {
		self.keyDownBuffer = e.data.keyDownBuffer
		self.interruptBuffer = e.data.interruptBuffer;
	}
	else if (e.data.cmd === 'debug') {
		BINDING.call_static_method("[Sponge.Compiler]Sponge.Compiler.Program:Run", [e.data.code, e.data.breakpoints.join(), self.interruptBuffer]);
	}
	else if (e.data.cmd === 'run') {
		BINDING.call_static_method("[Sponge.Compiler]Sponge.Compiler.Program:Run", [e.data.code, e.data.breakpoints.join(), self.interruptBuffer]);
	}
	else if (e.data.cmd === 'stop') {
		BINDING.call_static_method("[Sponge.Compiler]Sponge.Compiler.Program:Stop", []);
	}
}

function workerPrint (msg) { self.postMessage({ cmd: 'print', msg: msg }) }
function workerPostMessageStr (msg) { self.postMessage(JSON.parse(msg)) }
function createHttpReq() { return new XMLHttpRequest(); }
function workerCheckKeyDown(keyCode) { return self.keyDownBuffer[keyCode] > 0;}
