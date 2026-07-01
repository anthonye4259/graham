require 'xcodeproj'

project_path = 'ios/App/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find the App target
target = project.targets.find { |t| t.name == 'App' }

# Find or create the App group
app_group = project.main_group.find_subpath(File.join('App'), true)
app_group.set_source_tree('<group>')

# Add the entitlements file reference
entitlements_path = 'App.entitlements'
unless app_group.find_file_by_path(entitlements_path)
  file_ref = app_group.new_file(entitlements_path)
  
  # Set build settings
  target.build_configurations.each do |config|
    config.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'App/App.entitlements'
  end
end

project.save
