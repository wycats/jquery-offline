# Override Rack::Static to allow a fallthrough for missing files
module Rack
  class Static

    def initialize(app, options={})
      @app = app
      @urls = options[:urls] || ["/favicon.ico"]
      @root = options[:root] || Dir.pwd
      @file_server = Rack::File.new(@root)
    end

    def call(env)
      path = env["PATH_INFO"]
      can_serve = @urls.any? { |url| path.index(url) == 0 }

      if can_serve && ::File.exist?("#{@root}/#{path}")
        @file_server.call(env)
      else
        @app.call(env)
      end
    end

  end
end

use Rack::Static, :urls => ["/"], :root => "lib"
use Rack::Static, :urls => ["/"], :root => "public"

current = Hash.new(0)

map "/reset" do
  run proc {
    current = Hash.new(0)
    [200, {"Content-Type" => "text/plain"}, ["success"]]
  }
end

map "/ajax/app" do
  run proc { |env|
    string = env["QUERY_STRING"]
    now = current[string] += 1
    [200, 
      {"Content-Type" => "application/json"}, 
      [%{{"count": #{now}, "qs": #{string.inspect}}}]
    ]
  }
end